import { useCallback, useEffect, useState } from "react";
import AttendanceRecord, {
  type AttendanceStatus,
  AttendanceStatus as AttendanceStatusEnum,
} from "@/database/models/AttendanceRecord";
import SchoolMember from "@/database/models/SchoolMember";
import { useStore } from "@/store";
import { AttendanceRecordRepository } from "../repositories";
import { StudentRepository } from "@/modules/students/repositories";
import { bulkSaveAttendanceList } from "../services";

/**
 * Extended attendance record with member info
 */
export interface AttendanceWithMember {
  record: AttendanceRecord | null;
  member: SchoolMember;
  status: AttendanceStatus;
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

  // Load attendance data via repositories
  useEffect(() => {
    if (!sessionId || !schoolId) {
      setAttendanceList([]);
      setIsLoading(false);
      return;
    }

    // Only observe attendance records - members are loaded based on records
    const recordsSub = AttendanceRecordRepository.observeBySessionId(
      sessionId,
    ).subscribe({
      next: async (records: AttendanceRecord[]) => {
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
          const memberById = new Map(members.map((m) => [m.id, m]));

          // Build attendance list with member data
          const list: AttendanceWithMember[] = records
            .map((record) => {
              const member = memberById.get(record.schoolMemberId);
              if (!member) return null;

              return {
                record,
                member,
                status: record.status,
              };
            })
            .filter((item): item is AttendanceWithMember => item !== null);

          // Sort by display name
          list.sort((a, b) =>
            (a.member.displayName || "").localeCompare(
              b.member.displayName || "",
            ),
          );

          setAttendanceList(list);
          setIsLoading(false);
        } catch (err) {
          console.error("[useAttendance] Error loading members:", err);
          setError(t("errorLoadingFailed"));
          setIsLoading(false);
        }
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
      setAttendanceList((prev) =>
        prev.map((item) =>
          item.member.id === memberId ? { ...item, status: newStatus } : item,
        ),
      );
    },
    [],
  );

  // Save all attendance via service
  const saveAll = useCallback(async () => {
    if (!sessionId || attendanceList.length === 0) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await bulkSaveAttendanceList(
        sessionId,
        attendanceList.map((item) => ({
          memberId: item.member.id,
          status: item.status,
        })),
      );
    } catch (err) {
      console.error("[useAttendance] Save error:", err);
      const message = err instanceof Error ? err.message : t("errorSaveFailed");
      setError(message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [sessionId, attendanceList]);

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
    refresh,
  };
};
