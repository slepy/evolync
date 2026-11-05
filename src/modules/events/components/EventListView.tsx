import {
  ChipFilter,
  DateTimeField,
  ExpandButton,
  ListCard,
  ListEmpty,
  ListIcon,
  ListRow,
  ListSection,
  StatusBadge,
} from "@/core/components";
import { EVENT_STATUS } from "@/database/models/Event";
import { formatDay } from "@/modules/trainings/components/format";
import { timestampToDay } from "@/modules/trainings/types/helpers";
import { CalendarDays } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { ActivityIndicator } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { useEventList } from "../hooks/useEventList";
import { EventRowParticipants } from "./EventRowParticipants";
import { eventTypeFilterOptions, filterEventList, toggleExpandedId, withFromDay } from "./eventList";
import { formatEventDates } from "./formatEventDates";

const formatShortDay = (day: string) => formatDay(day, { day: "numeric", month: "short", year: "numeric" });

interface EventListViewProps {
  organizationId: string | undefined;
  /** Default FROM–TO ("YYYY-MM-DD"): the month shown in Month view. */
  initialRange: { from: string; to: string };
  onEventPress: (eventId: string) => void;
  /** A tap on a participant of an expanded row opens that event's Participants screen. */
  onManageParticipants: (eventId: string) => void;
}

/**
 * List view of the organization calendar: FROM / TO and type chips in a
 * filters card, then the events overlapping the range ("N events"), each row
 * `dates · type · place` with a Cancelled badge; its chevron expands the
 * participants with their status, a tap on the row opens the details and a
 * tap on a participant opens the event's Participants screen.
 * Filters live as long as the view; trainings are not listed (they have no type).
 */
export const EventListView: React.FC<EventListViewProps> = ({
  organizationId,
  initialRange,
  onEventPress,
  onManageParticipants,
}) => {
  const [range, setRange] = useState(initialRange);
  const [typeFilter, setTypeFilter] = useState("");
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(new Set());
  const { events, types, typeNames, isLoading } = useEventList(organizationId, range.from, range.to);

  const options = useMemo(
    () => eventTypeFilterOptions(events, types, range, { all: t("all"), none: t("eventsListNoType") }),
    [events, types, range],
  );
  // A chosen type that is gone (deleted, "No type" no longer offered) falls back to All.
  const activeType = options.some((option) => option.value === typeFilter) ? typeFilter : "";
  const listed = useMemo(
    () => filterEventList(events, { ...range, typeId: activeType || null }),
    [events, range, activeType],
  );

  return (
    <YStack gap={18}>
      <YStack
        gap={14}
        padding={14}
        borderRadius="$card"
        borderWidth={1}
        borderColor="$neutralCardBorder"
        backgroundColor="$neutralCard"
      >
        <XStack gap={12}>
          <DateTimeField
            mode="date"
            label={t("from")}
            value={range.from}
            format={formatShortDay}
            onChange={(from) => setRange((r) => withFromDay(r, from))}
            accent="events"
          />
          <DateTimeField
            mode="date"
            label={t("eventsListTo")}
            value={range.to}
            format={formatShortDay}
            min={range.from}
            onChange={(to) => setRange((r) => ({ ...r, to }))}
            accent="events"
          />
        </XStack>
        <YStack gap={8}>
          <Text fontSize={12} fontWeight="$eyebrow" letterSpacing={0.8} textTransform="uppercase" color="$neutralMuted">
            {t("eventsTypeLabel")}
          </Text>
          <ChipFilter options={options} value={activeType} onChange={setTypeFilter} accent="events" />
        </YStack>
      </YStack>

      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <ListSection title={t("eventsListCount", { count: listed.length })}>
          {listed.length > 0 ? (
            <ListCard aria-label={t("eventsListCount", { count: listed.length })}>
              {listed.map((event) => {
                const cancelled = event.status === EVENT_STATUS.CANCELLED;
                const typeName = event.typeId ? typeNames.get(event.typeId) : undefined;
                const expanded = expandedIds.has(event.id);
                return (
                  <ListRow
                    key={event.id}
                    title={event.name}
                    subtitle={[
                      formatEventDates(timestampToDay(event.startDate), timestampToDay(event.endDate)),
                      typeName,
                      event.address,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                    leading={<ListIcon icon={CalendarDays} accent="events" />}
                    trailing={
                      <XStack alignItems="center" gap={4} flexShrink={0}>
                        {cancelled ? <StatusBadge label={t("statusCancelled")} color="danger" /> : null}
                        <ExpandButton
                          expanded={expanded}
                          label={t(expanded ? "eventsHideParticipants" : "eventsShowParticipants")}
                          onPress={() => setExpandedIds((ids) => toggleExpandedId(ids, event.id))}
                        />
                      </XStack>
                    }
                    expanded={expanded}
                    onPress={() => onEventPress(event.id)}
                  >
                    {expanded ? (
                      <EventRowParticipants
                        eventId={event.id}
                        onManageParticipants={() => onManageParticipants(event.id)}
                      />
                    ) : null}
                  </ListRow>
                );
              })}
            </ListCard>
          ) : (
            <ListEmpty text={t("eventsListEmpty")} />
          )}
        </ListSection>
      )}
    </YStack>
  );
};
