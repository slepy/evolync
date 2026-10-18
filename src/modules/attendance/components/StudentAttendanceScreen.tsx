import {
  ListCard,
  ListEmpty,
  ListIcon,
  ListRow,
  ListSection,
  StatusBadge,
  StatusSummary,
  SubScreenPage,
  ratePercent,
} from "@/core/components";
import { LoadingScreen } from "@/core/components";
import { CalendarCheck } from "lucide-react-native";
import React from "react";
import { ATTENDANCE_STATUS_STYLE, ATTENDANCE_SUMMARY_ORDER } from "../constants";
import { useStudentAttendance } from "../hooks";
import {
  dateLocaleTag,
  formatSessionMonth,
  formatSessionTime,
  formatSessionTitle,
  groupSessionsByMonth,
} from "../sessionList";

interface StudentAttendanceScreenProps {
  memberId: string | undefined;
  /** Shown under each session ("Warszawa Mokotów · 18:00"). */
  schoolName?: string;
}

/**
 * The student's own attendance, read-only: Status summary (sessions, % present),
 * then the sessions grouped by month, each with its status badge on the right.
 */
export const StudentAttendanceScreen: React.FC<StudentAttendanceScreenProps> = ({ memberId, schoolName }) => {
  const { attendance, stats, isLoading } = useStudentAttendance(memberId);
  const locale = dateLocaleTag(t("locale"));

  if (memberId && isLoading) return <LoadingScreen />;

  const groups = groupSessionsByMonth(attendance.map((item) => ({ ...item, sessionDate: item.session.sessionDate })));

  return (
    <SubScreenPage title={t("attendanceTitle")} context="student">
      {!memberId ? (
        <ListEmpty text={t("pendingMembershipInfo")} />
      ) : attendance.length === 0 ? (
        <ListEmpty text={t("emptyNoAttendance")} />
      ) : (
        <>
          <StatusSummary
            title={t("studentSessionsCount", { count: stats.total })}
            subtitle={t("attendancePercentPresent", { percent: ratePercent(stats.present, stats.total) })}
            items={ATTENDANCE_SUMMARY_ORDER.map((status) => {
              const style = ATTENDANCE_STATUS_STYLE[status];
              return {
                key: status,
                count: stats[status],
                label: t(style.label),
                icon: style.icon,
                barColor: style.barColor,
                iconColor: style.tint,
              };
            })}
          />
          <ListSection title={t("attendanceSessions")}>
            {groups.map((group) => (
              <ListSection key={group.key} variant="label" title={formatSessionMonth(group.month, locale)}>
                <ListCard aria-label={formatSessionMonth(group.month, locale)}>
                  {group.sessions.map((item) => {
                    const style = ATTENDANCE_STATUS_STYLE[item.localStatus];
                    const time = formatSessionTime(item.sessionDate, locale);
                    return (
                      <ListRow
                        key={item.record.id}
                        title={formatSessionTitle(item.sessionDate, locale)}
                        subtitle={[schoolName, time].filter(Boolean).join(" · ") || undefined}
                        leading={<ListIcon icon={CalendarCheck} accent="attendance" size={44} />}
                        trailing={<StatusBadge label={t(style.label)} color={{ tint: style.tint, fill: style.fill }} />}
                      />
                    );
                  })}
                </ListCard>
              </ListSection>
            ))}
          </ListSection>
        </>
      )}
    </SubScreenPage>
  );
};
