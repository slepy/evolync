import { useCallback, useEffect, useState } from "react";
import {
  EVENT_PARTICIPANT_STATUS,
  type EventParticipantStatus,
} from "@/database/models/EventParticipant";
import { EventParticipantRepository } from "../repositories";
import { useStore } from "@/store";
import { sync } from "@/database/sync";
import type { StudentEvent } from "./useStudentEvents";

/**
 * Extended event with local status for editing
 */
interface EventWithLocalStatus extends StudentEvent {
  localStatus: EventParticipantStatus;
}

interface UseStudentEventStatusesOptions {
  /** When false (default), student can only toggle between absent ↔ attending. Paid is locked. */
  isInstructor?: boolean;
}

/**
 * Hook for managing student event participation statuses with local editing
 *
 * Features:
 * - Local state management for status changes (like useStudentPayments/useStudentAttendance)
 * - Tracks unsaved changes
 * - Batch save all changes at once
 * - Instructor: cycles through absent → attending → paid → absent
 * - Student: toggles between absent ↔ attending only (paid is locked)
 */
export const useStudentEventStatuses = (
  events: StudentEvent[],
  options?: UseStudentEventStatusesOptions,
) => {
  const isInstructor = options?.isInstructor ?? false;
  const [localEvents, setLocalEvents] = useState<EventWithLocalStatus[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useStore();

  // Initialize local state from events
  useEffect(() => {
    setLocalEvents(
      events.map((event) => ({
        ...event,
        localStatus: event.participantStatus,
      })),
    );
  }, [events]);

  // Toggle status locally
  const toggleStatus = useCallback(
    (participantId: string) => {
      setLocalEvents((prev) =>
        prev.map((item) => {
          if (item.participantId !== participantId) return item;

          // Students cannot change paid status
          if (
            !isInstructor &&
            item.localStatus === EVENT_PARTICIPANT_STATUS.PAID
          ) {
            return item;
          }

          let newStatus: EventParticipantStatus;

          if (isInstructor) {
            // Instructor: cycle through all statuses (absent → attending → paid → absent)
            switch (item.localStatus) {
              case EVENT_PARTICIPANT_STATUS.ABSENT:
                newStatus = EVENT_PARTICIPANT_STATUS.ATTENDING;
                break;
              case EVENT_PARTICIPANT_STATUS.ATTENDING:
                newStatus = EVENT_PARTICIPANT_STATUS.PAID;
                break;
              case EVENT_PARTICIPANT_STATUS.PAID:
                newStatus = EVENT_PARTICIPANT_STATUS.ABSENT;
                break;
              default:
                newStatus = EVENT_PARTICIPANT_STATUS.ATTENDING;
            }
          } else {
            // Student: toggle between absent ↔ attending only
            newStatus =
              item.localStatus === EVENT_PARTICIPANT_STATUS.ABSENT
                ? EVENT_PARTICIPANT_STATUS.ATTENDING
                : EVENT_PARTICIPANT_STATUS.ABSENT;
          }

          return {
            ...item,
            localStatus: newStatus,
          };
        }),
      );
    },
    [isInstructor],
  );

  // Check if there are unsaved changes
  const hasChanges = localEvents.some(
    (event) => event.localStatus !== event.participantStatus,
  );

  // Save all changes to database
  const saveAll = useCallback(async () => {
    if (!user?.id || !hasChanges) return;

    setIsSaving(true);
    try {
      // Find all changed statuses
      const changedEvents = localEvents.filter(
        (event) => event.localStatus !== event.participantStatus,
      );

      // Update each participant status in database
      const updatePromises = changedEvents.map((event) =>
        EventParticipantRepository.updateStatus(
          event.participantId,
          event.localStatus,
          user.id,
        ),
      );

      await Promise.all(updatePromises);

      // Update local state so participantStatus matches localStatus (clear pending changes)
      setLocalEvents((prev) =>
        prev.map((event) => ({
          ...event,
          participantStatus: event.localStatus,
        })),
      );

      // Trigger sync in background
      sync().catch((err) => {
        console.error("[useStudentEventStatuses] Sync error:", err);
      });
    } catch (error) {
      console.error("[useStudentEventStatuses] Save error:", error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, localEvents, hasChanges]);

  return {
    localEvents,
    toggleStatus,
    saveAll,
    hasChanges,
    isSaving,
  };
};
