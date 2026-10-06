import AttendanceRecord from "@/database/models/AttendanceRecord";
import TrainingSession from "@/database/models/TrainingSession";
import { useEffect, useMemo, useState } from "react";
import { AttendanceRecordRepository, TrainingSessionRepository } from "../repositories";
import { countSessions, groupSessionsByMonth, isSameDay, type SessionCounts } from "../sessionList";

export interface SessionListEntry {
  session: TrainingSession;
  counts: SessionCounts;
}

/**
 * Sessions of a school grouped by month with their present / total counts
 * (13A). Sessions and records are observed side by side; the list waits for
 * both so a row never flashes "0 of 0".
 */
export const useAttendanceSessionList = (schoolId: string | undefined) => {
  const [sessions, setSessions] = useState<TrainingSession[] | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!schoolId) {
      setSessions([]);
      setRecords([]);
      return;
    }
    const onError = (err: Error) => {
      console.error("[useAttendanceSessionList] Observer error:", err);
      setError(t("errorLoadingFailed"));
      setSessions((s) => s ?? []);
      setRecords((r) => r ?? []);
    };
    const sessionsSub = TrainingSessionRepository.observeBySchoolId(schoolId).subscribe({
      next: setSessions,
      error: onError,
    });
    const recordsSub = AttendanceRecordRepository.observeBySchoolId(schoolId).subscribe({
      next: setRecords,
      error: onError,
    });
    return () => {
      sessionsSub.unsubscribe();
      recordsSub.unsubscribe();
    };
  }, [schoolId]);

  const groups = useMemo(() => {
    const counts = countSessions(records ?? []);
    const entries = (sessions ?? []).map((session) => ({
      session,
      sessionDate: session.sessionDate,
      counts: counts[session.id] ?? { present: 0, total: 0 },
    }));
    return groupSessionsByMonth(entries);
  }, [sessions, records]);

  const todaySession = useMemo(
    () => (sessions ?? []).find((session) => isSameDay(session.sessionDate, new Date())) ?? null,
    [sessions],
  );

  return { groups, todaySession, isLoading: sessions === null || records === null, error };
};
