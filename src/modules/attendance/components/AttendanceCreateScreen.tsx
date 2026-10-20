import { DEFAULT_ATTENDANCE_STATUS } from "@/database/models/AttendanceRecord";
import type SchoolMember from "@/database/models/SchoolMember";
import { LoadingScreen } from "@/core/components";
import { StudentRepository } from "@/modules/students/repositories";
import React, { useEffect, useMemo, useState } from "react";
import { createSessionWithAttendance } from "../services";
import { dateLocaleTag, formatDayMonthShort } from "../sessionList";
import { nextStatus, type AttendanceRow } from "./sessionRow";
import { AttendanceSessionBody } from "./AttendanceSessionBody";

export interface AttendanceCreateScreenProps {
  schoolId: string;
  /** After Create: back to the sessions. */
  onCreated: () => void;
}

/** New session for today (13C): every active member starts Present; Create saves the session with its attendance. */
export const AttendanceCreateScreen: React.FC<AttendanceCreateScreenProps> = ({ schoolId, onCreated }) => {
  const sessionDate = useMemo(() => new Date(), []);
  const [rows, setRows] = useState<AttendanceRow[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const subscription = StudentRepository.observeActiveBySchoolId(schoolId).subscribe({
      next: (members: SchoolMember[]) => {
        setRows((prev) => {
          const previous = new Map((prev ?? []).map((row) => [row.member.id, row.status]));
          return [...members]
            .sort((a, b) => (a.displayName || "").localeCompare(b.displayName || ""))
            .map((member) => ({
              member,
              status: previous.get(member.id) ?? DEFAULT_ATTENDANCE_STATUS,
              disabled: false,
            }));
        });
      },
      error: (err: Error) => {
        console.error("[AttendanceCreateScreen] Members observer error:", err);
        setError(t("attendanceErrorLoadingAttendance"));
        setRows((prev) => prev ?? []);
      },
    });
    return () => subscription.unsubscribe();
  }, [schoolId]);

  const handleCreate = async () => {
    if (!rows || rows.length === 0) return;
    setIsSaving(true);
    setError(null);
    try {
      await createSessionWithAttendance(
        schoolId,
        sessionDate,
        rows.map((row) => ({ memberId: row.member.id, status: row.status })),
      );
      onCreated();
    } catch (err) {
      console.error("[AttendanceCreateScreen] Create error:", err);
      setError(err instanceof Error ? err.message : t("errorSaveFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  if (!rows) return <LoadingScreen />;

  return (
    <AttendanceSessionBody
      title={t("attendanceTodayTitle", { date: formatDayMonthShort(sessionDate, dateLocaleTag(t("locale"))) })}
      rows={rows}
      onToggle={(memberId) =>
        setRows((prev) =>
          (prev ?? []).map((row) => (row.member.id === memberId ? { ...row, status: nextStatus(row.status) } : row)),
        )
      }
      buttonLabel={t("create")}
      showButton
      onSubmit={handleCreate}
      isSaving={isSaving}
      error={error}
    />
  );
};
