import { DEFAULT_ATTENDANCE_STATUS } from "@/database/models/AttendanceRecord";
import type SchoolMember from "@/database/models/SchoolMember";
import type TrainingSession from "@/database/models/TrainingSession";
import { DateTimeField, LoadingScreen, PillGroup } from "@/core/components";
import { StudentRepository } from "@/modules/students/repositories";
import React, { useEffect, useMemo, useState } from "react";
import { Text, YStack } from "tamagui";
import { TrainingSessionRepository } from "../repositories";
import { createSessionWithAttendance } from "../services";
import {
  dateLocaleTag,
  findSessionOnDay,
  formatSessionDate,
  parseDayKey,
  sessionDateForDay,
  toDayKey,
  yesterdayKey,
} from "../sessionList";
import { nextStatus, type AttendanceRow } from "./sessionRow";
import { AttendanceSessionBody } from "./AttendanceSessionBody";

type SessionDay = "today" | "past";

export interface AttendanceCreateScreenProps {
  schoolId: string;
  /** After Create: back to the sessions. */
  onCreated: () => void;
  /** The picked day already has a session (one per day): "Open" shows it. */
  onOpenSession: (sessionId: string) => void;
}

/**
 * New session (13C / 13C1): DAY Today or Past date (a DATE field, no future
 * days); every active member starts Present; Create saves the session with its
 * attendance on the picked day. A day that already has a session offers Open.
 */
export const AttendanceCreateScreen: React.FC<AttendanceCreateScreenProps> = ({ schoolId, onCreated, onOpenSession }) => {
  const now = useMemo(() => new Date(), []);
  const todayKey = toDayKey(now);
  const [day, setDay] = useState<SessionDay>("today");
  const [pastDay, setPastDay] = useState(() => yesterdayKey(now));
  const [rows, setRows] = useState<AttendanceRow[] | null>(null);
  const [sessions, setSessions] = useState<TrainingSession[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locale = dateLocaleTag(t("locale"));

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

  useEffect(() => {
    const subscription = TrainingSessionRepository.observeBySchoolId(schoolId).subscribe({
      next: setSessions,
      error: (err: Error) => {
        console.error("[AttendanceCreateScreen] Sessions observer error:", err);
        setError(t("attendanceErrorLoadingAttendance"));
        setSessions((prev) => prev ?? []);
      },
    });
    return () => subscription.unsubscribe();
  }, [schoolId]);

  const sessionDate = sessionDateForDay(day === "past" ? pastDay : null, now);
  const existing = findSessionOnDay(sessions ?? [], sessionDate);

  const handleCreate = async () => {
    if (existing) {
      onOpenSession(existing.id);
      return;
    }
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

  // Both lists first: before the sessions load, Create could add a second session to a day that has one.
  if (!rows || !sessions) return <LoadingScreen />;

  const existsNote = existing ? t("attendanceSessionExists") : null;
  const dayPicker = (
    <PillGroup<SessionDay>
      label={t("day")}
      accent="attendance"
      value={day}
      onChange={setDay}
      options={[
        { value: "today", label: t("today") },
        { value: "past", label: t("pastDate") },
      ]}
    />
  );

  return (
    <AttendanceSessionBody
      title={t("attendanceNewSession")}
      rows={existing ? rows.map((row) => ({ ...row, disabled: true })) : rows}
      onToggle={(memberId) =>
        setRows((prev) =>
          (prev ?? []).map((row) => (row.member.id === memberId ? { ...row, status: nextStatus(row.status) } : row)),
        )
      }
      buttonLabel={existing ? t("open") : t("create")}
      showButton
      onSubmit={handleCreate}
      isSaving={isSaving}
      error={error}
    >
      {day === "today" ? (
        <YStack gap={8}>
          {dayPicker}
          <Text fontSize={12.5} fontWeight="$secondary" color="$neutralMuted">
            {existsNote ?? formatSessionDate(now, locale)}
          </Text>
        </YStack>
      ) : (
        <>
          {dayPicker}
          <DateTimeField
            label={t("fieldDate")}
            mode="date"
            value={pastDay}
            onChange={setPastDay}
            max={todayKey}
            accent="attendance"
            format={(value) => formatSessionDate(parseDayKey(value) ?? now, locale)}
            hint={existsNote ?? t("attendancePastDateHint")}
          />
        </>
      )}
    </AttendanceSessionBody>
  );
};
