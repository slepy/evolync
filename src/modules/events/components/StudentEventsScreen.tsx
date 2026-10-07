import {
  ListCard,
  ListEmpty,
  ListIcon,
  ListRow,
  StatusBadge,
  StatusSummary,
  SubScreenPage,
  ViewSwitch,
  withAlpha,
} from "@/core/components";
import { EVENT_STATUS } from "@/database/models/Event";
import { LoadingScreen } from "@/modules/core/components/LoadingScreen";
import { localToday, timestampToDay } from "@/modules/trainings/types/helpers";
import { CalendarDays, History } from "lucide-react-native";
import React, { useState } from "react";
import { PARTICIPANT_STATUS_STYLE, PARTICIPANT_SUMMARY_ORDER } from "../constants";
import { useStudentEvents } from "../hooks/useStudentEvents";
import { formatEventDates } from "./formatEventDates";
import { countByParticipantStatus, filterStudentEvents } from "./studentEvents";

interface StudentEventsScreenProps {
  memberId: string | undefined;
  onEventPress: (eventId: string) => void;
}

/**
 * The student's own events: Upcoming / Historical switch, a static Status
 * summary of the shown events, one row per event (dates · place, status
 * badge on the right). A row opens the event details, where the student
 * answers Attending / Absent. Without a membership: the pending info.
 */
export const StudentEventsScreen: React.FC<StudentEventsScreenProps> = ({ memberId, onEventPress }) => {
  const { events, isLoading } = useStudentEvents(memberId, { includeCancelled: true });
  const [view, setView] = useState<"upcoming" | "past">("upcoming");

  if (memberId && isLoading) return <LoadingScreen />;

  const shown = filterStudentEvents(events, view, localToday());
  const counts = countByParticipantStatus(shown);

  return (
    <SubScreenPage title={t("eventsTitle")} context="student">
      {!memberId ? (
        <ListEmpty text={t("pendingMembershipInfo")} />
      ) : (
        <>
          <ViewSwitch
            accent="events"
            aria-label={t("eventsTitle")}
            active={view === "upcoming" ? "first" : "second"}
            first={{ icon: CalendarDays, label: t("eventsFilterUpcoming"), onPress: () => setView("upcoming") }}
            second={{ icon: History, label: t("eventsFilterHistorical"), onPress: () => setView("past") }}
          />
          {shown.length === 0 ? (
            <ListEmpty text={view === "upcoming" ? t("emptyNoUpcomingEvents") : t("emptyNoHistoricalEvents")} />
          ) : (
            <>
              <StatusSummary
                title={t("studentEventsCount", { count: shown.length })}
                subtitle={t("eventsComingCount", { count: counts.paid + counts.attending })}
                accent="events"
                items={PARTICIPANT_SUMMARY_ORDER.map((status) => {
                  const style = PARTICIPANT_STATUS_STYLE[status];
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
              <ListCard aria-label={t("eventsTitle")}>
                {shown.map(({ event, participantId, participantStatus }) => {
                  const cancelled = event.status === EVENT_STATUS.CANCELLED;
                  const style = PARTICIPANT_STATUS_STYLE[participantStatus];
                  const when = formatEventDates(timestampToDay(event.startDate), timestampToDay(event.endDate));
                  return (
                    <ListRow
                      key={participantId}
                      role="link"
                      title={event.name}
                      subtitle={event.address ? `${when} · ${event.address}` : when}
                      leading={<ListIcon icon={CalendarDays} accent={cancelled ? "neutral" : "events"} size={44} />}
                      trailing={
                        cancelled ? (
                          <StatusBadge label={t("statusCancelled")} color="danger" />
                        ) : (
                          <StatusBadge label={t(style.label)} color={{ tint: style.tint, fill: withAlpha(style.tint, 0.16) }} />
                        )
                      }
                      onPress={() => onEventPress(event.id)}
                    />
                  );
                })}
              </ListCard>
            </>
          )}
        </>
      )}
    </SubScreenPage>
  );
};
