import { useCallback, useEffect, useRef, useState } from "react";
import AttendanceRecord, {
  type AttendanceStatus,
  AttendanceStatus as AttendanceStatusEnum,
} from "@/database/models/AttendanceRecord";
import SchoolMember from "@/database/models/SchoolMember";
import { useStore } from "@/store";
import { AttendanceRecordRepository } from "../repositories";
import { StudentRepository } from "@/modules/students/repositories";
import { MemberStatus } from "@/modules/students/types";
import { bulkSaveAttendanceList } from "../services";

/**
 * Extended attendance record with member info
 */
export interface AttendanceWithMember {
  record: AttendanceRecord | null;
  member: SchoolMember;
  status: AttendanceStatus;
  /** True when the member has since been archived — historical value is kept, editing is not allowed. */
  disabled: boolean;
}

/**
 * Hook for managing attendance for a training session
 *
 * Features:
 * - Shows ONLY members who have attendance records in this session
 * - Members added after session creation will NOT appear
 * - Local state management for status changes
 * - Reactive to local database changes via repositories
 * - Save all attendance at once via service
 */
export const useAttendance = (
  sessionId: string | undefined,
  schoolId: string | undefined,
) => {
  // Local attendance state (editable)
  const [attendanceList, setAttendanceList] = useState<AttendanceWithMember[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { performSync } = useStore();
  /*
   * While a save / delete runs and the screen leaves, the list stays as it is:
   * re-rendering it in the frame the route is popped (rows reloaded, Save
   * hidden) left Android with a black screen. The latest emission is kept and
   * applied if the action fails.
   */
  const heldRef = useRef(false);
  const pendingRef = useRef<AttendanceRecord[] | null>(null);
  /** Members whose status the user changed since the list was last built. */
  const editedRef = useRef(new Set<string>());
  const applyRef = useRef<(records: AttendanceRecord[], keepDrafts?: boolean) => void>(() => {});

  // Load attendance data via repositories
  useEffect(() => {
    if (!sessionId || !schoolId) {
      setAttendanceList([]);
      setIsLoading(false);
      return;
    }

    // Builds the list: members are loaded based on the records. `keepDrafts`
    // keeps the unsaved statuses on screen (after a failed Save).
    applyRef.current = async (records: AttendanceRecord[], keepDrafts = false) => {
      try {
        // Get member IDs from attendance records
        const memberIds = records.map((r) => r.schoolMemberId);

        if (memberIds.length === 0) {
          setAttendanceList([]);
          setIsLoading(false);
          return;
        }

        // Load members for these attendance records
        const members = await StudentRepository.findByIds(memberIds);
        if (heldRef.current) {
          pendingRef.current = records;
          return;
        }
        const memberById = new Map(members.map((m) => [m.id, m]));

        // Build attendance list with member data
        const list: AttendanceWithMember[] = records
          .map((record): AttendanceWithMember | null => {
            const member = memberById.get(record.schoolMemberId);
            if (!member) return null;

            return {
              record,
              member,
              status: record.status,
              disabled: member.status === MemberStatus.ARCHIVED,
            };
          })
          .filter((item): item is AttendanceWithMember => item !== null);

        // Sort by display name
        list.sort((a, b) =>
          (a.member.displayName || "").localeCompare(
            b.member.displayName || "",
          ),
        );

        if (keepDrafts) {
          setAttendanceList((prev) => {
            const drafts = new Map(prev.map((item) => [item.member.id, item.status]));
            return list.map((item) =>
              item.disabled || !editedRef.current.has(item.member.id)
                ? item
                : { ...item, status: drafts.get(item.member.id) ?? item.status },
            );
          });
        } else {
          editedRef.current.clear();
          setAttendanceList(list);
        }
        setIsLoading(false);
      } catch (err) {
        console.error("[useAttendance] Error loading members:", err);
        setError(t("errorLoadingFailed"));
        setIsLoading(false);
      }
    };

    // Only observe attendance records - members are loaded based on records
    const recordsSub = AttendanceRecordRepository.observeBySessionId(
      sessionId,
    ).subscribe({
      next: (records: AttendanceRecord[]) => {
        if (heldRef.current) {
          pendingRef.current = records;
          return;
        }
        applyRef.current(records);
      },
      error: (err: Error) => {
        console.error("[useAttendance] Records observer error:", err);
        setError(t("errorLoadingFailed"));
        setIsLoading(false);
      },
    });

    return () => {
      recordsSub.unsubscribe();
    };
  }, [sessionId, schoolId]);

  // Toggle attendance status locally (updates local state only)
  const toggleStatus = useCallback(
    (memberId: string, newStatus: AttendanceStatus) => {
      editedRef.current.add(memberId);
      setAttendanceList((prev) =>
        prev.map((item) =>
          item.member.id === memberId && !item.disabled
            ? { ...item, status: newStatus }
            : item,
        ),
      );
    },
    [],
  );

  /**
   * Runs an action after which the screen leaves (Save, Delete): the list is
   * held from the start and stays held on success; a failure releases it,
   * applies what arrived meanwhile and rethrows. Ignored while one runs.
   */
  const runAndLeave = useCallback(async (action: () => Promise<void>) => {
    if (heldRef.current) return false;
    heldRef.current = true;
    try {
      await action();
      return true;
    } catch (err) {
      heldRef.current = false;
      const pending = pendingRef.current;
      pendingRef.current = null;
      if (pending) applyRef.current(pending, true);
      throw err;
    }
  }, []);

  // Save all attendance via service; true once saved (the screen then leaves).
  const saveAll = useCallback(async () => {
    if (!sessionId || attendanceList.length === 0 || heldRef.current) {
      return false;
    }

    setIsSaving(true);
    setError(null);

    try {
      return await runAndLeave(() =>
        bulkSaveAttendanceList(
          sessionId,
          attendanceList.map((item) => ({
            memberId: item.member.id,
            status: item.status,
          })),
        ),
      );
    } catch (err) {
      console.error("[useAttendance] Save error:", err);
      const message = err instanceof Error ? err.message : t("errorSaveFailed");
      setError(message);
      setIsSaving(false);
      throw err;
    }
  }, [sessionId, attendanceList, runAndLeave]);

  // Get attendance statistics
  const stats = {
    total: attendanceList.length,
    present: attendanceList.filter(
      (a) => a.status === AttendanceStatusEnum.PRESENT,
    ).length,
    absent: attendanceList.filter(
      (a) => a.status === AttendanceStatusEnum.ABSENT,
    ).length,
    excused: attendanceList.filter(
      (a) => a.status === AttendanceStatusEnum.EXCUSED,
    ).length,
  };

  // Manual refresh - triggers global sync
  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await performSync(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("errorLoadingFailed");
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [performSync]);

  return {
    attendanceList,
    stats,
    isLoading,
    isSaving,
    error,
    toggleStatus,
    saveAll,
    runAndLeave,
    refresh,
  };
};
