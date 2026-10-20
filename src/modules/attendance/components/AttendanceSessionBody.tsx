import {
  MemberAvatar,
  ListCard,
  ListEmpty,
  ListRow,
  PrimaryButton,
  StatusButton,
  StatusSummary,
  SubScreenPage,
  ratePercent,
} from "@/core/components";
import React from "react";
import { Text, YStack } from "tamagui";
import { ATTENDANCE_STATUS_STYLE, ATTENDANCE_SUMMARY_ORDER } from "../constants";
import { countStatuses } from "../sessionList";
import type { AttendanceRow } from "./sessionRow";

export interface AttendanceSessionBodyProps {
  title: string;
  rows: AttendanceRow[];
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
export function AttendanceSessionBody({
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
