import {
  MemberAvatar,
  ListCard,
  ListEmpty,
  ListRow,
  PrimaryButton,
  StatusButton,
  StatusSummary,
  SubScreenPage,
  TrashButton,
  ratePercent,
} from "@/core/components";
import { DEFAULT_ATTENDANCE_STATUS, STATUS_CYCLE, type AttendanceStatus } from "@/database/models/AttendanceRecord";
import type SchoolMember from "@/database/models/SchoolMember";
import TrainingSession from "@/database/models/TrainingSession";
import { LoadingScreen } from "@/modules/core/components/LoadingScreen";
import { confirmDelete } from "@/modules/core/utils/confirmDelete";
import { StudentRepository } from "@/modules/students/repositories";
import React, { useEffect, useMemo, useState } from "react";
import { Text, YStack } from "tamagui";
import { ATTENDANCE_STATUS_STYLE, ATTENDANCE_SUMMARY_ORDER } from "../constants";
import { useAttendance } from "../hooks/useAttendance";
import { TrainingSessionRepository } from "../repositories";
import { createSessionWithAttendance, deleteTrainingSession } from "../services";
import { countStatuses, dateLocaleTag, formatDayMonthShort, formatSessionShort } from "../sessionList";

const nextStatus = (status: AttendanceStatus): AttendanceStatus =>
  STATUS_CYCLE[(STATUS_CYCLE.indexOf(status) + 1) % STATUS_CYCLE.length];

interface Row {
  member: SchoolMember;
  status: AttendanceStatus;
  /** Archived member: the historical status stays, it cannot be changed. */
  disabled: boolean;
}

interface AttendanceSessionBodyProps {
  title: string;
  rows: Row[];
  onToggle: (memberId: string) => void;
  buttonLabel: string;
  /** Hidden until there is something to save (13B); always shown on 13C. */
  showButton: boolean;
  onSubmit: () => void;
  isSaving: boolean;
  error: string | null;
  /** Trash button in the header (13B): deletes the session. */
  headerAction?: React.ReactNode;
}

/** 13B / 13C: Status summary, hint, member rows with a status button, Save / Create pinned at the bottom. */
function AttendanceSessionBody({
  title,
  rows,
  onToggle,
  buttonLabel,
  showButton,
  onSubmit,
  isSaving,
  error,
  headerAction,
}: AttendanceSessionBodyProps) {
  const counts = countStatuses(rows);

  return (
    <SubScreenPage
      title={title}
      context="school"
      right={headerAction}
      footer={
        showButton || error ? (
          <YStack gap={10}>
            {error ? (
              <Text fontSize={12.5} fontWeight="$secondary" color="$trashText" textAlign="center">
                {error}
              </Text>
            ) : null}
            {showButton ? (
              <PrimaryButton
                label={buttonLabel}
                accent="attendance"
                onPress={onSubmit}
                loading={isSaving}
                disabled={rows.length === 0}
              />
            ) : null}
          </YStack>
        ) : undefined
      }
    >
      <YStack gap={16}>
        <StatusSummary
          title={t("membersCount", { count: rows.length })}
          subtitle={t("attendancePresentSummary", {
            count: counts.present,
            percent: ratePercent(counts.present, rows.length),
          })}
          accent="attendance"
          items={ATTENDANCE_SUMMARY_ORDER.map((status) => {
            const style = ATTENDANCE_STATUS_STYLE[status];
            return {
              key: status,
              count: counts[status],
              label: t(style.label),
              icon: style.icon,
              barColor: style.barColor,
              iconColor: style.tint,
            };
          })}
        />
        <Text fontSize={13} fontWeight="$secondary" color="$neutralMuted">
          {t("attendanceStatusHint")}
        </Text>
        {rows.length === 0 ? (
          <ListEmpty text={t("emptyNoMembers")} hint={t("emptyNoMembersHint")} />
        ) : (
          <ListCard>
            {rows.map((row) => {
              const name = row.member.displayName || t("unknownMember");
              const style = ATTENDANCE_STATUS_STYLE[row.status];
              return (
                <ListRow
                  key={row.member.id}
                  size="md"
                  title={name}
                  subtitle={row.member.email}
                  leading={<MemberAvatar name={name} uri={row.member.avatarUrl} rankId={row.member.currentRankId} />}
                  trailing={
                    <StatusButton
                      icon={style.icon}
                      color={{ tint: style.tint, fill: style.fill }}
                      label={t("statusChangeNow", { status: t(style.label) })}
                      disabled={row.disabled || isSaving}
                      onPress={() => onToggle(row.member.id)}
                    />
                  }
                />
              );
            })}
          </ListCard>
        )}
      </YStack>
    </SubScreenPage>
  );
}

interface AttendanceSessionScreenProps {
  schoolId: string;
  sessionId: string;
  /** After Save or Delete: back to the sessions. */
  onSaved: () => void;
}

/** Session details (13B): tap a status to change it; Save appears after a change; the trash deletes the session. */
export const AttendanceSessionScreen: React.FC<AttendanceSessionScreenProps> = ({ schoolId, sessionId, onSaved }) => {
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { attendanceList, isLoading, isSaving, error, toggleStatus, saveAll } = useAttendance(sessionId, schoolId);

  useEffect(() => {
    const subscription = TrainingSessionRepository.observeById(sessionId).subscribe({
      next: setSession,
      error: (err: Error) => console.error("[AttendanceSessionScreen] Load session error:", err),
    });
    return () => subscription.unsubscribe();
  }, [sessionId]);

  const changed = attendanceList.some((item) => item.record && item.status !== item.record.status);

  const handleSave = async () => {
    try {
      await saveAll();
      onSaved();
    } catch {
      // The hook keeps the error, shown above the button.
    }
  };

  const handleDelete = () =>
    confirmDelete(t("attendanceDeleteTitle"), t("attendanceDeleteMessage"), async () => {
      setIsDeleting(true);
      setDeleteError(null);
      try {
        await deleteTrainingSession(sessionId);
        onSaved();
      } catch (err) {
        console.error("[AttendanceSessionScreen] Delete error:", err);
        setDeleteError(t("errorDeleteFailed"));
        setIsDeleting(false);
      }
    });

  if (isLoading || !session) return <LoadingScreen />;

  return (
    <AttendanceSessionBody
      title={formatSessionShort(session.sessionDate, dateLocaleTag(t("locale")))}
      rows={attendanceList}
      onToggle={(memberId) => {
        const item = attendanceList.find((i) => i.member.id === memberId);
        if (item) toggleStatus(memberId, nextStatus(item.status));
      }}
      buttonLabel={t("save")}
      showButton={changed}
      onSubmit={handleSave}
      isSaving={isSaving || isDeleting}
      error={deleteError ?? error}
      headerAction={
        <TrashButton label={t("attendanceDeleteTitle")} onPress={handleDelete} disabled={isSaving || isDeleting} />
      }
    />
  );
};

interface AttendanceCreateScreenProps {
  schoolId: string;
  /** After Create: back to the sessions. */
  onCreated: () => void;
}

/** New session for today (13C): every active member starts Present; Create saves the session with its attendance. */
export const AttendanceCreateScreen: React.FC<AttendanceCreateScreenProps> = ({ schoolId, onCreated }) => {
  const sessionDate = useMemo(() => new Date(), []);
  const [rows, setRows] = useState<Row[] | null>(null);
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
