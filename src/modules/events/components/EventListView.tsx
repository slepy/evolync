import {
  ChipFilter,
  DateTimeField,
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
import { eventTypeFilterOptions, filterEventList, withFromDay } from "./eventList";
import { formatEventDates } from "./formatEventDates";

const formatShortDay = (day: string) => formatDay(day, { day: "numeric", month: "short", year: "numeric" });

interface EventListViewProps {
  organizationId: string | undefined;
  /** Default FROM–TO ("YYYY-MM-DD"): the month shown in Month view. */
  initialRange: { from: string; to: string };
  onEventPress: (eventId: string) => void;
}

/**
 * List view of the organization calendar: FROM / TO and type chips in a
 * filters card, then the events overlapping the range ("N events"), each row
 * `dates · type · place` with a Cancelled badge. Filters live as long as the
 * view; trainings are not listed (they have no type).
 */
export const EventListView: React.FC<EventListViewProps> = ({ organizationId, initialRange, onEventPress }) => {
  const [range, setRange] = useState(initialRange);
  const [typeFilter, setTypeFilter] = useState("");
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
                    trailing={cancelled ? <StatusBadge label={t("statusCancelled")} color="danger" /> : undefined}
                    onPress={() => onEventPress(event.id)}
                  />
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
