import { useCallback, useEffect, useState } from "react";
import EventParticipant from "@/database/models/EventParticipant";
import {
  EVENT_PARTICIPANT_STATUS,
  type EventParticipantStatus,
} from "@/database/models/EventParticipant";
import SchoolMember from "@/database/models/SchoolMember";
import { useStore } from "@/store";
import { EventParticipantRepository } from "../repositories";
import { StudentRepository } from "@/modules/students/repositories";
import { bulkSaveParticipantStatuses } from "../services";

/**
 * Extended participant with member info and local status
 */
export interface ParticipantWithMember {
  participant: EventParticipant;
  member: SchoolMember;
  status: EventParticipantStatus;
}

export interface ParticipantCounts {
  absent: number;
  attending: number;
  paid: number;
}

/**
 * Hook for managing event participants
 *
 * Features:
 * - Local state management for status changes (like useAttendance)
 * - Reactive to local database changes via repositories
 * - Save all statuses at once via service
 * - Counts are calculated from local state for editing, updated immediately from DB
 */
export const useEventParticipants = (eventId: string | undefined, refreshKey?: number) => {
  // Local participant state (editable)
  const [participantList, setParticipantList] = useState<ParticipantWithMember[]>([]);
  // DB-sourced counts (updated synchronously from observer)
  const [dbCounts, setDbCounts] = useState<ParticipantCounts>({
    absent: 0,
    attending: 0,
    paid: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, performSync } = useStore();

  // Reset state when refreshKey changes to ensure fresh data
  useEffect(() => {
    setIsLoading(true);
  }, [refreshKey]);

  // Load participant data via repositories
  useEffect(() => {
    if (!eventId) {
      setParticipantList([]);
      setDbCounts({ absent: 0, attending: 0, paid: 0 });
      setIsLoading(false);
      return;
    }

    // Combine both observables
    let currentParticipants: EventParticipant[] = [];
    let currentMembers: SchoolMember[] = [];

    const updateList = () => {
      const memberById = new Map(currentMembers.map((m) => [m.id, m]));

      const list: ParticipantWithMember[] = currentParticipants
        .map((participant) => {
          const member = memberById.get(participant.schoolMemberId);
          if (!member) return null;
          return {
            participant,
            member,
            status: participant.status,
          };
        })
        .filter((item): item is ParticipantWithMember => item !== null);

      // Sort by display name
      list.sort((a, b) =>
        (a.member.displayName || "").localeCompare(b.member.displayName || "")
      );

      setParticipantList(list);
      setIsLoading(false);
    };

    // Subscribe to participants via repository
    const participantsSub = EventParticipantRepository.observeByEventId(eventId).subscribe({
      next: (participants: EventParticipant[]) => {
        currentParticipants = participants;

        // Update counts immediately from DB data (synchronous)
        const newCounts: ParticipantCounts = {
          absent: participants.filter((p) => p.status === EVENT_PARTICIPANT_STATUS.ABSENT).length,
          attending: participants.filter((p) => p.status === EVENT_PARTICIPANT_STATUS.ATTENDING).length,
          paid: participants.filter((p) => p.status === EVENT_PARTICIPANT_STATUS.PAID).length,
        };
        setDbCounts(newCounts);

        // Load members for these participants (async)
        const memberIds = participants.map((p) => p.schoolMemberId);
        if (memberIds.length > 0) {
          StudentRepository.findByIds(memberIds).then((members) => {
            currentMembers = members;
            updateList();
          });
        } else {
          currentMembers = [];
          updateList();
        }
      },
      error: (err: Error) => {
        console.error("[useEventParticipants] Participants observer error:", err);
        setError(t("errorLoadingFailed"));
        setIsLoading(false);
      },
    });

    return () => {
      participantsSub.unsubscribe();
    };
  }, [eventId, refreshKey]);

  // Toggle participant status locally (updates local state only)
  const toggleStatus = useCallback(
    (participantId: string, newStatus: EventParticipantStatus) => {
      setParticipantList((prev) =>
        prev.map((item) =>
          item.participant.id === participantId ? { ...item, status: newStatus } : item
        )
      );
    },
    []
  );

  // Save all participant statuses via service
  const saveAll = useCallback(async () => {
    if (!eventId || !user?.id || participantList.length === 0) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await bulkSaveParticipantStatuses(
        eventId,
        participantList.map((item) => ({
          participantId: item.participant.id,
          status: item.status,
        })),
        user.id
      );
    } catch (err) {
      console.error("[useEventParticipants] Save error:", err);
      const message =
        err instanceof Error ? err.message : t("errorSaveFailed");
      setError(message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [eventId, user?.id, participantList]);

  // Local counts (for editing view - reflects unsaved changes)
  const localCounts: ParticipantCounts = {
    absent: participantList.filter((p) => p.status === EVENT_PARTICIPANT_STATUS.ABSENT).length,
    attending: participantList.filter((p) => p.status === EVENT_PARTICIPANT_STATUS.ATTENDING).length,
    paid: participantList.filter((p) => p.status === EVENT_PARTICIPANT_STATUS.PAID).length,
  };

  // Use local counts when editing (participantList has data), otherwise use DB counts
  const counts = participantList.length > 0 ? localCounts : dbCounts;

  // Manual refresh - triggers global sync
  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await performSync(true);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : t("errorLoadingFailed");
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [performSync]);

  return {
    participantList,
    counts,
    dbCounts, // Export DB counts separately for screens that just need to read
    isLoading,
    isSaving,
    error,
    toggleStatus,
    saveAll,
    refresh,
  };
};
