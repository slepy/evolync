import { useCallback, useEffect, useMemo, useState } from "react";
import EventParticipant from "@/database/models/EventParticipant";
import {
  EVENT_PARTICIPANT_STATUS,
  type EventParticipantStatus,
} from "@/database/models/EventParticipant";
import SchoolMember from "@/database/models/SchoolMember";
import { useStore } from "@/store";
import { EventParticipantRepository } from "../repositories";
import { StudentRepository } from "@/modules/students/repositories";
import { bulkSaveParticipantStatuses, setParticipantTakesExam } from "../services";
import {
  draftStatus,
  pruneStatusDrafts,
  withStatusDraft,
  type ParticipantStatusDrafts,
} from "../components/participantDrafts";

/**
 * Extended participant with member info and local status
 */
export interface ParticipantWithMember {
  participant: EventParticipant;
  member: SchoolMember;
  /** The unsaved draft status when there is one, else the stored status. */
  status: EventParticipantStatus;
  /** Stored right away (10D), never a draft. */
  takesExam: boolean;
}

interface ParticipantRow {
  participant: EventParticipant;
  member: SchoolMember;
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
 * - Local draft statuses (like useAttendance), kept when the database re-emits
 *   (a Takes exam write must not reset unsaved statuses)
 * - Reactive to local database changes via repositories
 * - Save all statuses at once via service
 * - Counts are calculated from local state for editing, updated immediately from DB
 */
export const useEventParticipants = (eventId: string | undefined, refreshKey?: number) => {
  // Participants with their members, as stored
  const [rows, setRows] = useState<ParticipantRow[]>([]);
  // Unsaved statuses by participant id
  const [drafts, setDrafts] = useState<ParticipantStatusDrafts>({});
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
      setRows([]);
      setDrafts({});
      setDbCounts({ absent: 0, attending: 0, paid: 0 });
      setIsLoading(false);
      return;
    }

    // Combine both observables
    let currentParticipants: EventParticipant[] = [];
    let currentMembers: SchoolMember[] = [];

    const updateList = () => {
      const memberById = new Map(currentMembers.map((m) => [m.id, m]));

      const list: ParticipantRow[] = currentParticipants
        .map((participant) => {
          const member = memberById.get(participant.schoolMemberId);
          return member ? { participant, member } : null;
        })
        .filter((item): item is ParticipantRow => item !== null);

      // Sort by display name
      list.sort((a, b) =>
        (a.member.displayName || "").localeCompare(b.member.displayName || "")
      );

      setRows(list);
      setDrafts((prev) => pruneStatusDrafts(prev, currentParticipants));
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

  const participantList: ParticipantWithMember[] = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        status: draftStatus(row.participant, drafts),
        takesExam: !!row.participant.takesExam,
      })),
    [rows, drafts]
  );
  const hasStatusChanges = participantList.some((item) => item.status !== item.participant.status);

  // Toggle participant status locally (a draft until Save)
  const toggleStatus = useCallback(
    (participantId: string, newStatus: EventParticipantStatus) => {
      const row = rows.find((r) => r.participant.id === participantId);
      if (!row) return;
      setDrafts((prev) => withStatusDraft(prev, row.participant, newStatus));
    },
    [rows]
  );

  // Takes exam is stored right away (10D), unlike the statuses
  const setTakesExam = useCallback(
    async (participantId: string, takesExam: boolean) => {
      setError(null);
      try {
        await setParticipantTakesExam(participantId, takesExam);
      } catch (err) {
        console.error("[useEventParticipants] Takes exam error:", err);
        setError(t("errorSaveFailed"));
      }
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
    hasStatusChanges,
    toggleStatus,
    setTakesExam,
    saveAll,
    refresh,
  };
};
