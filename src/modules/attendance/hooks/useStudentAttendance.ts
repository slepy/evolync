import { useCallback, useEffect, useRef, useState } from "react";
import AttendanceRecord, {
  type AttendanceStatus,
} from "@/database/models/AttendanceRecord";
import TrainingSession from "@/database/models/TrainingSession";
import {
  AttendanceRecordRepository,
  TrainingSessionRepository,
} from "../repositories";
import { bulkUpdateAttendanceStatus } from "../services";

/**
 * Attendance record with session info for display
 */
export interface StudentAttendanceItem {
  record: AttendanceRecord;
  session: TrainingSession;
  /** Local status (may differ from record.status if user made changes) */
  localStatus: AttendanceStatus;
}

/**
 * Hook for fetching all attendance records for a specific student
 * with deferred save support (changes are only persisted when saveAll is called)
 */
export const useStudentAttendance = (studentId: string | undefined) => {
  const [attendance, setAttendance] = useState<StudentAttendanceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track if we've done initial load to prevent re-loading on every render
  const hasLoaded = useRef(false);

  // Track local changes: recordId -> newStatus
  const localChangesRef = useRef<Map<string, AttendanceStatus>>(new Map());

  // Load attendance data via repositories (one-time load, not continuous observation)
  useEffect(() => {
    if (!studentId) {
      setAttendance([]);
      setIsLoading(false);
      return;
    }

    // Only load once per studentId
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    const loadData = async () => {
      try {
        const records: AttendanceRecord[] = await AttendanceRecordRepository.findByMemberId(studentId);

        // Fetch session info for each record via repository
        const sessionIds = [...new Set(records.map((r: AttendanceRecord) => r.trainingSessionId))];
        const sessions = await TrainingSessionRepository.findByIds(sessionIds);
        const sessionMap = new Map(sessions.map((s) => [s.id, s]));

        const items: StudentAttendanceItem[] = records
          .map((record: AttendanceRecord) => {
            const session = sessionMap.get(record.trainingSessionId);
            if (!session) return null;
            // Use local change if exists, otherwise use record status
            const localStatus =
              localChangesRef.current.get(record.id) ?? record.status;
            return { record, session, localStatus };
          })
          .filter((item): item is StudentAttendanceItem => item !== null);

        // Sort by session date (most recent first)
        items.sort(
          (a, b) =>
            b.session.sessionDate.getTime() - a.session.sessionDate.getTime()
        );

        setAttendance(items);
      } catch (err) {
        console.error("[useStudentAttendance] Error loading:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [studentId]);

  // Reset hasLoaded when studentId changes
  useEffect(() => {
    hasLoaded.current = false;
  }, [studentId]);

  // Calculate statistics based on local status (reflects pending changes)
  const stats = {
    total: attendance.length,
    present: attendance.filter((a) => a.localStatus === "present").length,
    absent: attendance.filter((a) => a.localStatus === "absent").length,
    excused: attendance.filter((a) => a.localStatus === "excused").length,
    attendanceRate:
      attendance.length > 0
        ? Math.round(
            (attendance.filter((a) => a.localStatus === "present").length /
              attendance.length) *
              100
          )
        : 0,
  };

  // Check if there are unsaved changes
  const hasChanges = localChangesRef.current.size > 0;

  // Update attendance status locally only (does not persist to database)
  const updateAttendanceStatusLocal = useCallback(
    (recordId: string, newStatus: AttendanceStatus) => {
      // Find the original status from the record
      const item = attendance.find((a) => a.record.id === recordId);
      if (!item) return;

      // If new status matches original, remove from changes
      if (item.record.status === newStatus) {
        localChangesRef.current.delete(recordId);
      } else {
        localChangesRef.current.set(recordId, newStatus);
      }

      // Update local state for UI
      setAttendance((prev) =>
        prev.map((a) =>
          a.record.id === recordId ? { ...a, localStatus: newStatus } : a
        )
      );
    },
    [attendance]
  );

  // Save all pending changes via service
  const saveAll = useCallback(async () => {
    if (localChangesRef.current.size === 0) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const updates = Array.from(localChangesRef.current.entries()).map(
        ([recordId, status]) => ({ recordId, status })
      );

      await bulkUpdateAttendanceStatus(updates);

      // Clear local changes after successful save
      localChangesRef.current.clear();
    } catch (err) {
      console.error("[useStudentAttendance] Save error:", err);
      const message =
        err instanceof Error ? err.message : t("errorSaveFailed");
      setError(message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Discard all pending changes
  const discardChanges = useCallback(() => {
    localChangesRef.current.clear();
    // Reset local statuses to match record statuses
    setAttendance((prev) =>
      prev.map((item) => ({
        ...item,
        localStatus: item.record.status,
      }))
    );
  }, []);

  return {
    attendance,
    stats,
    isLoading,
    isSaving,
    error,
    hasChanges,
    updateAttendanceStatusLocal,
    saveAll,
    discardChanges,
  };
};
