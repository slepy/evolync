import {
  ChoiceList,
  ListCard,
  ListChip,
  ListIcon,
  ListRow,
  ListSection,
  type ListAccent,
  SubScreenPage,
  withAlpha,
} from "@/core/components";
import { moduleAccents } from "@/core/theme/tokens";
import { EVENT_STATUS } from "@/database/models/Event";
import { EVENT_PARTICIPANT_STATUS, type EventParticipantStatus } from "@/database/models/EventParticipant";
import { formatPrice } from "@/modules/core/utils/formatters";
import { showError } from "@/modules/trainings/components/confirmAction";
import { localToday, timestampToDay } from "@/modules/trainings/types/helpers";
import { CalendarDays, MapPin } from "lucide-react-native";
import React from "react";
import { ActivityIndicator } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { PARTICIPANT_STATUS_STYLE } from "../constants";
import { useEvent } from "../hooks/useEvent";
import { useParticipantStatus } from "../hooks/useParticipantStatus";
import { eventDayCount } from "./eventFormState";
import { formatEventDates } from "./formatEventDates";
import { canStudentAnswer } from "./studentEvents";

interface StudentEventDetailsScreenProps {
  eventId: string;
  /** The student's membership in the event's school. */
  memberId: string | undefined;
}

const EVENTS = moduleAccents.events;
const PAYMENTS = moduleAccents.payments;
const STATUS_ACCENT: Record<EventParticipantStatus, ListAccent> = {
  [EVENT_PARTICIPANT_STATUS.PAID]: "payments",
  [EVENT_PARTICIPANT_STATUS.ATTENDING]: "events",
  [EVENT_PARTICIPANT_STATUS.ABSENT]: "neutral",
};

/**
 * Event details for a student (10C without the instructor actions): name
 * with the day count, short note, date and location rows, price, and the
 * student's own participation. Attending / Absent is answered here and saved
 * at once; Paid (set by the instructor), a cancelled or a finished event
 * shows the status read-only.
 */
export const StudentEventDetailsScreen: React.FC<StudentEventDetailsScreenProps> = ({ eventId, memberId }) => {
  const { event, isLoading } = useEvent(eventId);
  const participation = useParticipantStatus(eventId, memberId);

  if (isLoading || participation.isLoading || !event) {
    return (
      <SubScreenPage title={t("eventsDetailsTitle")} context="student">
        {isLoading || participation.isLoading ? (
          <ActivityIndicator color={EVENTS.tint} />
        ) : (
          <Text fontSize={14} fontWeight="$secondary" color="$neutralMuted" textAlign="center">
            {t("eventsNotFound")}
          </Text>
        )}
      </SubScreenPage>
    );
  }

  const startDate = timestampToDay(event.startDate);
  const endDate = timestampToDay(event.endDate);
  const days = eventDayCount(startDate, endDate) ?? 1;
  const isCancelled = event.status === EVENT_STATUS.CANCELLED;
  const status = participation.status;
  const style = PARTICIPANT_STATUS_STYLE[status];
  // Only a member the event was given to answers it (no new participant from here).
  const canAnswer =
    participation.participant !== null &&
    canStudentAnswer(status, { endDate: event.endDate, cancelled: isCancelled }, localToday());

  const answer = async (value: EventParticipantStatus) => {
    if (value === status) return;
    try {
      await participation.setStatus(value, false);
    } catch (err) {
      console.error("[StudentEventDetails] Answer failed:", err);
      showError(t("errorUpdateFailed"));
    }
  };

  return (
    <SubScreenPage title={t("eventsDetailsTitle")} context="student">
      <YStack gap={8}>
        <XStack alignItems="center" gap={10} flexWrap="wrap">
          <Text
            flexShrink={1}
            fontSize="$title"
            fontWeight="$title"
            letterSpacing={-0.5}
            color={isCancelled ? "$neutralMuted" : "$neutralText"}
            textDecorationLine={isCancelled ? "line-through" : "none"}
          >
            {event.name}
          </Text>
          <ListChip accent="events" label={t("eventsDaysCount", { count: days })} />
          {isCancelled ? <ListChip accent="danger" label={t("statusCancelled")} /> : null}
        </XStack>
        {event.shortNote ? (
          <Text fontSize={14} fontWeight="$secondary" color="$neutralMuted">
            {event.shortNote}
          </Text>
        ) : null}
      </YStack>

      <YStack gap={10}>
        <ListCard>
          <ListRow
            title={formatEventDates(startDate, endDate)}
            subtitle={`${t("fieldDate")} · ${t("eventsDaysCount", { count: days })}`}
            leading={<ListIcon icon={CalendarDays} size={44} />}
          />
          {event.address ? (
            <ListRow title={event.address} subtitle={t("fieldLocation")} leading={<ListIcon icon={MapPin} size={44} />} />
          ) : null}
        </ListCard>
        {event.price > 0 ? (
          <XStack
            alignItems="center"
            justifyContent="space-between"
            padding={16}
            borderRadius="$card"
            backgroundColor={withAlpha(PAYMENTS.tint, 0.1)}
            borderWidth={1}
            borderColor={withAlpha(PAYMENTS.tint, 0.5)}
          >
            <Text fontSize={14} fontWeight="600" color="$paymentsTint" opacity={0.8}>
              {t("fieldPrice")}
            </Text>
            <Text fontSize={20} fontWeight="$title" color="$paymentsTint">
              {formatPrice(event.price, event.currency)}
            </Text>
          </XStack>
        ) : null}
      </YStack>

      <ListSection title={t("eventsYourParticipation")}>
        {canAnswer ? (
          <ChoiceList
            label={t("eventsYourParticipation")}
            accent="events"
            disabled={participation.isUpdating}
            value={status}
            onChange={answer}
            options={[
              {
                value: EVENT_PARTICIPANT_STATUS.ATTENDING,
                title: t("statusAttending"),
                hint: t("eventsAttendingHint"),
              },
              { value: EVENT_PARTICIPANT_STATUS.ABSENT, title: t("statusAbsent"), hint: t("eventsAbsentHint") },
            ]}
          />
        ) : (
          <ListCard>
            <ListRow
              title={t(style.label)}
              subtitle={status === EVENT_PARTICIPANT_STATUS.PAID ? t("eventsPaidLockedHint") : undefined}
              leading={<ListIcon icon={style.icon} accent={STATUS_ACCENT[status]} size={44} />}
            />
          </ListCard>
        )}
      </ListSection>
    </SubScreenPage>
  );
};
