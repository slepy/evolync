import {
  ActionPill,
  ListCard,
  ListChip,
  ListIcon,
  ListRow,
  ListSection,
  PrimaryButton,
  SubScreenPage,
  TrashButton,
  withAlpha,
} from "@/core/components";
import { danger, moduleAccents, neutral } from "@/core/theme/tokens";
import { EVENT_STATUS } from "@/database/models/Event";
import { formatPrice } from "@/modules/core/utils/formatters";
import { showError } from "@/modules/trainings/components/confirmAction";
import { timestampToDay } from "@/modules/trainings/types/helpers";
import { CalendarDays, MapPin, Pencil, RotateCcw, Users, XCircle } from "lucide-react-native";
import React, { useState } from "react";
import { ActivityIndicator } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { useEvent } from "../hooks/useEvent";
import { useEventParticipants } from "../hooks/useEventParticipants";
import { cancelEvent, deleteEvent, updateEvent } from "../services";
import { EventCancelSheet, type EventSheetAction } from "./EventCancelSheet";
import { eventDayCount } from "./eventFormState";
import { formatEventDates } from "./formatEventDates";
import { ParticipantCountsCard } from "./ParticipantCountsCard";

interface EventDetailsScreenProps {
  eventId: string;
  onEdit: () => void;
  onManageParticipants: () => void;
  /** After a delete: back to where the event was opened from (the calendar). */
  onDeleted: () => void;
}

const EVENTS = moduleAccents.events;
const PAYMENTS = moduleAccents.payments;

/**
 * Event details (10C): name with the day count, short note, date and
 * location rows, price, participant counters with Manage, Edit / Cancel
 * (Restore when cancelled); trash in the header. Cancel and a blocked
 * delete go through the 10E sheet.
 */
export const EventDetailsScreen: React.FC<EventDetailsScreenProps> = ({
  eventId,
  onEdit,
  onManageParticipants,
  onDeleted,
}) => {
  const { event, isLoading } = useEvent(eventId);
  const { dbCounts: counts } = useEventParticipants(eventId);
  const [sheet, setSheet] = useState<EventSheetAction | null>(null);
  const [busy, setBusy] = useState(false);

  if (isLoading || !event) {
    return (
      <SubScreenPage title={t("eventsDetailsTitle")}>
        {isLoading ? (
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

  const run = async (action: () => Promise<unknown>, after?: () => void) => {
    try {
      setBusy(true);
      await action();
      setSheet(null);
      after?.();
    } catch (err) {
      showError(t(err instanceof Error ? err.message : "errorUpdateFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <SubScreenPage
        title={t("eventsDetailsTitle")}
        right={<TrashButton label={t("eventsDeleteTitle")} onPress={() => setSheet("delete")} disabled={busy} />}
      >
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
              <ListRow
                title={event.address}
                subtitle={t("fieldLocation")}
                leading={<ListIcon icon={MapPin} size={44} />}
              />
            ) : null}
          </ListCard>
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
        </YStack>

        <ListSection title={t("eventsParticipants")}>
          <YStack gap={12}>
            <ParticipantCountsCard counts={counts} />
            <PrimaryButton label={t("eventsManage")} icon={Users} accent="events" onPress={onManageParticipants} />
          </YStack>
        </ListSection>

        <ListSection title={t("eventsActions")}>
          <XStack gap={10}>
            {!isCancelled ? (
              <ActionPill label={t("edit")} icon={Pencil} tint={EVENTS.from} fill={EVENTS.fill} disabled={busy} onPress={onEdit} />
            ) : null}
            <ActionPill
              label={isCancelled ? t("eventsRestore") : t("cancel")}
              icon={isCancelled ? RotateCcw : XCircle}
              tint={isCancelled ? neutral.synced : danger.text}
              fill={isCancelled ? neutral.syncedFill : danger.fill}
              disabled={busy}
              onPress={
                isCancelled
                  ? () => run(() => updateEvent(event.id, { status: EVENT_STATUS.ACTIVE }))
                  : () => setSheet("cancel")
              }
            />
          </XStack>
        </ListSection>
      </SubScreenPage>

      <EventCancelSheet
        action={sheet}
        onClose={() => setSheet(null)}
        name={event.name}
        paidCount={counts.paid}
        busy={busy}
        onCancelEvent={() => run(() => cancelEvent(event.id))}
        onDeleteEvent={() => run(() => deleteEvent(event.id), onDeleted)}
      />
    </>
  );
};

