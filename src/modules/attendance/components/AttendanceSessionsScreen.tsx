import {
  ListCard,
  ListChip,
  ListEmpty,
  ListIcon,
  ListRow,
  ListSection,
  SubScreenPage,
  rateAccent,
  ratePercent,
} from "@/core/components";
import { LoadingScreen } from "@/core/components";
import { CalendarCheck, Users } from "lucide-react-native";
import React from "react";
import { Text } from "tamagui";
import { useAttendanceSessionList } from "../hooks/useAttendanceSessionList";
import { dateLocaleTag, formatSessionMonth, formatSessionTitle } from "../sessionList";

interface AttendanceSessionsScreenProps {
  schoolId: string;
  onSessionPress: (sessionId: string) => void;
  /** Add new: today's session opens when it already exists (one session per day). */
  onAdd: (todaySessionId: string | null) => void;
}

/**
 * Attendance (13A): "Sessions" with Add new, sessions grouped by month;
 * each row shows "7 of 10 present" and the rate chip.
 */
export const AttendanceSessionsScreen: React.FC<AttendanceSessionsScreenProps> = ({
  schoolId,
  onSessionPress,
  onAdd,
}) => {
  const { groups, todaySession, isLoading, error } = useAttendanceSessionList(schoolId);
  const locale = dateLocaleTag(t("locale"));

  if (isLoading) return <LoadingScreen />;

  return (
    <SubScreenPage title={t("attendanceTitle")} context="school">
      {error ? (
        <Text fontSize={13} fontWeight="$secondary" color="$trashText">
          {error}
        </Text>
      ) : null}
      <ListSection
        title={t("attendanceSessions")}
        accent="attendance"
        action={{ label: t("addNew"), onPress: () => onAdd(todaySession?.id ?? null) }}
      >
        {groups.length === 0 ? (
          <ListEmpty text={t("emptyNoSessions")} />
        ) : (
          groups.map((group) => (
            <ListSection key={group.key} variant="label" title={formatSessionMonth(group.month, locale)}>
              <ListCard aria-label={formatSessionMonth(group.month, locale)}>
                {group.sessions.map(({ session, counts }) => (
                  <ListRow
                    key={session.id}
                    title={formatSessionTitle(session.sessionDate, locale)}
                    subtitle={t("attendancePresentOf", { present: counts.present, total: counts.total })}
                    subtitleIcon={Users}
                    leading={<ListIcon icon={CalendarCheck} accent="attendance" size={44} />}
                    trailing={
                      <ListChip
                        label={`${ratePercent(counts.present, counts.total)}%`}
                        accent={rateAccent(counts.present, counts.total)}
                      />
                    }
                    onPress={() => onSessionPress(session.id)}
                  />
                ))}
              </ListCard>
            </ListSection>
          ))
        )}
      </ListSection>
    </SubScreenPage>
  );
};
