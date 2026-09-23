import { useCallback, useEffect, useState } from "react";
import EventParticipant from "@/database/models/EventParticipant";
import type { EventParticipantStatus } from "@/database/models/EventParticipant";
import { useStore } from "@/store";
import { EventParticipantRepository } from "../repositories";
import {
  getParticipantByEventAndMember,
  updateParticipantStatus,
  upsertEventParticipant,
} from "../services";

/**
 * Hook for managing a specific member's participation status in an event
 *
 * Features:
 * - Get current participant status
 * - Update status (with role-based restrictions)
 * - RSVP toggle for students
 */
export const useParticipantStatus = (
  eventId: string | undefined,
  schoolMemberId: string | undefined
) => {
  const [participant, setParticipant] = useState<EventParticipant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useStore();

  // Load participant status
  useEffect(() => {
    if (!eventId || !schoolMemberId) {
      setParticipant(null);
      setIsLoading(false);
      return;
    }

    const loadParticipant = async () => {
      try {
        const result = await getParticipantByEventAndMember(
          eventId,
          schoolMemberId
        );
        setParticipant(result);
      } catch (err) {
        console.error("[useParticipantStatus] Load error:", err);
        setError(t("errorLoadingFailed"));
      } finally {
        setIsLoading(false);
      }
    };

    loadParticipant();
  }, [eventId, schoolMemberId]);

  // Update status (for instructors)
  const handleSetStatus = useCallback(
    async (status: EventParticipantStatus, isInstructor: boolean = false) => {
      if (!eventId || !schoolMemberId) {
        throw new Error("eventsErrorNoEvent");
      }

      if (!user?.id) {
        throw new Error("eventsErrorNoUser");
      }

      try {
        setIsUpdating(true);
        setError(null);

        if (participant) {
          // Update existing participant
          const updated = await updateParticipantStatus(
            participant.id,
            status,
            user.id,
            isInstructor
          );
          setParticipant(updated);
        } else {
          // Create new participant record
          const created = await upsertEventParticipant({
            eventId,
            schoolMemberId,
            status,
            statusChangedBy: user.id,
          });
          setParticipant(created);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : t("errorUpdateFailed");
        setError(message);
        throw err;
      } finally {
        setIsUpdating(false);
      }
    },
    [eventId, schoolMemberId, participant, user?.id]
  );

  // Toggle RSVP (for students: absent <-> attending)
  const handleToggleRsvp = useCallback(async () => {
    const currentStatus = participant?.status || "absent";

    // Students can only toggle between absent and attending
    if (currentStatus === "paid") {
      throw new Error("eventsErrorCannotChangeLockedStatus");
    }

    const newStatus: EventParticipantStatus =
      currentStatus === "attending" ? "absent" : "attending";

    await handleSetStatus(newStatus, false);
  }, [participant?.status, handleSetStatus]);

  return {
    participant,
    status: participant?.status || "absent",
    isPaid: participant?.status === "paid",
    isAttending: participant?.status === "attending",
    isLoading,
    isUpdating,
    error,
    setStatus: handleSetStatus,
    toggleRsvp: handleToggleRsvp,
  };
};
