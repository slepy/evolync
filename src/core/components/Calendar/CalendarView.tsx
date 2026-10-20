import { contextColors, moduleAccents, neutral, type ContextKey } from "@/core/theme/tokens";
import { LinearGradient } from "expo-linear-gradient";
import { CalendarDays, ChevronLeft, ChevronRight, Repeat } from "lucide-react-native";
import { StyleSheet } from "react-native";
import { Spinner, Text, View, XStack, YStack } from "tamagui";
import { ListCard } from "../List/ListCard";
import { ListIcon } from "../List/ListParts";
import { ListSection } from "../List/ListSection";
import { resolveListAccent, withAlpha, type ListAccent } from "../List/accent";
import type { CalendarDayCell, CalendarFilter } from "./calendarMonth";

export interface CalendarRow {
  key: string;
  kind: "event" | "training";
  title: string;
  /** "18:00–19:30 · Warszawa Mokotów", "20 Nov – 24 Nov · Zakopane". */
  meta: string;
  /** "Day 2/5", "↻ Weekly", "Cancelled". */
  badge?: { label: string; accent: ListAccent };
  cancelled?: boolean;
  onPress?: () => void;
}

export interface CalendarViewProps {
  /** Organization = amber, School = red, Student = blue: selected day, today ring, Add new. */
  context: ContextKey;
  /** Filter chips (All / Events / Trainings); hidden when only one kind is shown. */
  filter?: CalendarFilter;
  onFilterChange?: (filter: CalendarFilter) => void;
  monthLabel: string;
  /** Seven labels, Monday first ("MON"…). */
  weekdayLabels: string[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  cells: (CalendarDayCell | null)[];
  onSelectDay: (day: string) => void;
  /** Accessible label of a day cell. */
  dayLabel: (cell: CalendarDayCell) => string;
  /** "Saturday, 22 Nov". */
  selectedTitle: string;
  /** "3 items" / "Nothing planned". */
  selectedSubtitle: string;
  rows: CalendarRow[];
  emptyText: string;
  /** "Add new" on the selected day; omitted for read-only calendars (student). */
  onAdd?: () => void;
  isLoading?: boolean;
}

const EVENT = moduleAccents.events;
const TRAINING = moduleAccents.trainings;
/** Bar color per lane: events gradient start, then its end. */
const LANE_COLORS = [EVENT.from, EVENT.to];

/**
 * Calendar body (boards 6 / 6A): filter chips, month grid with multi-day
 * event bars and event / training dots, then the selected day's items with
 * Add new. Presentational only — `Calendar` feeds it from the database.
 */
export function CalendarView({
  context,
  filter,
  onFilterChange,
  monthLabel,
  weekdayLabels,
  onPrevMonth,
  onNextMonth,
  cells,
  onSelectDay,
  dayLabel,
  selectedTitle,
  selectedSubtitle,
  rows,
  emptyText,
  onAdd,
  isLoading,
}: CalendarViewProps) {
  const weeks: (CalendarDayCell | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <YStack gap={16}>
      {filter && onFilterChange ? <FilterChips value={filter} onChange={onFilterChange} /> : null}

      <YStack
        gap={8}
        paddingTop={14}
        paddingHorizontal={10}
        paddingBottom={10}
        borderRadius={24}
        borderWidth={1}
        borderColor="$neutralCardBorder"
        backgroundColor="$neutralCard"
      >
        <XStack alignItems="center" justifyContent="space-between" paddingHorizontal={4} paddingBottom={6}>
          <MonthButton label={t("calendarPreviousMonth")} onPress={onPrevMonth} icon="prev" />
          <Text fontSize={18} fontWeight="$section" color="$neutralText">
            {monthLabel}
          </Text>
          <MonthButton label={t("calendarNextMonth")} onPress={onNextMonth} icon="next" />
        </XStack>

        <XStack>
          {weekdayLabels.map((label) => (
            <Text
              key={label}
              flex={1}
              textAlign="center"
              fontSize={11}
              fontWeight="$eyebrow"
              letterSpacing={0.5}
              color={neutral.placeholder}
            >
              {label}
            </Text>
          ))}
        </XStack>

        <YStack gap={4}>
          {weeks.map((week, index) => (
            <XStack key={index}>
              {week.map((cell, i) =>
                cell ? (
                  <DayCell key={cell.day} cell={cell} context={context} label={dayLabel(cell)} onPress={() => onSelectDay(cell.day)} />
                ) : (
                  <View key={`blank-${i}`} flex={1} height={62} />
                ),
              )}
            </XStack>
          ))}
        </YStack>
      </YStack>

      <ListSection
        title={selectedTitle}
        subtitle={selectedSubtitle}
        accent={context}
        action={onAdd ? { label: t("addNew"), onPress: onAdd } : undefined}
      >
        {isLoading ? (
          <YStack paddingVertical={18} alignItems="center">
            <Spinner color={contextColors[context].label} />
          </YStack>
        ) : rows.length === 0 ? (
          <View
            paddingVertical={18}
            paddingHorizontal={16}
            borderRadius={20}
            borderWidth={1}
            borderStyle="dashed"
            borderColor="$neutralRaisedBorder"
            backgroundColor="$neutralCard"
          >
            <Text fontSize={14} fontWeight="600" color="$neutralMuted">
              {emptyText}
            </Text>
          </View>
        ) : (
          <ListCard aria-label={selectedTitle}>
            {rows.map((row) => (
              <CalendarItemRow key={row.key} row={row} />
            ))}
          </ListCard>
        )}
      </ListSection>
    </YStack>
  );
}

// ============================================================================
// Parts
// ============================================================================

function FilterChips({ value, onChange }: { value: CalendarFilter; onChange: (filter: CalendarFilter) => void }) {
  const chips: { key: CalendarFilter; label: string; tint: string; fill: string; marker?: "round" | "square" }[] = [
    { key: "all", label: t("all"), tint: neutral.text, fill: withAlpha(neutral.text, 0.1) },
    { key: "events", label: t("eventsTitle"), tint: EVENT.from, fill: EVENT.fill, marker: "round" },
    { key: "trainings", label: t("trainingsTitle"), tint: TRAINING.tint, fill: TRAINING.fill, marker: "square" },
  ];

  return (
    <XStack role="radiogroup" aria-label={t("calendarFilterLabel")} gap={8}>
      {chips.map((chip) => {
        const on = chip.key === value;
        return (
          <XStack
            key={chip.key}
            role="radio"
            aria-checked={on}
            aria-label={chip.label}
            onPress={() => onChange(chip.key)}
            pressStyle={{ opacity: 0.85 }}
            flex={1}
            height={40}
            borderRadius={20}
            alignItems="center"
            justifyContent="center"
            gap={7}
            borderWidth={1}
            borderColor={on ? chip.tint : "$neutralRaisedBorder"}
            backgroundColor={on ? chip.fill : "$neutralPage"}
          >
            {chip.marker ? (
              <View width={7} height={7} borderRadius={chip.marker === "round" ? 4 : 2} backgroundColor={chip.tint} />
            ) : null}
            <Text fontSize={13.5} fontWeight="$button" color={on ? chip.tint : "$neutralMuted"}>
              {chip.label}
            </Text>
          </XStack>
        );
      })}
    </XStack>
  );
}

function MonthButton({ label, onPress, icon }: { label: string; onPress: () => void; icon: "prev" | "next" }) {
  const Icon = icon === "prev" ? ChevronLeft : ChevronRight;
  return (
    <View
      role="button"
      aria-label={label}
      onPress={onPress}
      pressStyle={{ opacity: 0.8 }}
      width={44}
      height={44}
      borderRadius={22}
      backgroundColor="$neutralTintFill"
      alignItems="center"
      justifyContent="center"
    >
      <Icon size={20} color={neutral.text} strokeWidth={2.4} />
    </View>
  );
}

function DayCell({
  cell,
  context,
  label,
  onPress,
}: {
  cell: CalendarDayCell;
  context: ContextKey;
  label: string;
  onPress: () => void;
}) {
  const c = contextColors[context];

  return (
    <YStack
      role="button"
      aria-label={label}
      aria-selected={cell.isSelected}
      onPress={onPress}
      pressStyle={{ opacity: 0.8 }}
      flex={1}
      height={62}
      gap={3}
    >
      <XStack justifyContent="center">
        <View
          width={30}
          height={30}
          borderRadius={15}
          overflow="hidden"
          alignItems="center"
          justifyContent="center"
          borderWidth={!cell.isSelected && cell.isToday ? 1.5 : 0}
          borderColor={c.label}
        >
          {cell.isSelected ? (
            <LinearGradient
              colors={[c.gradient[0].color, c.gradient[c.gradient.length - 1].color]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          ) : null}
          <Text
            fontSize={15}
            fontWeight="$section"
            color={cell.isSelected ? c.fg : cell.isToday ? c.label : "$neutralText"}
          >
            {cell.dayOfMonth}
          </Text>
        </View>
      </XStack>

      {cell.lanes.map((segment, lane) => (
        <View
          key={lane}
          height={5}
          backgroundColor={segment ? LANE_COLORS[lane] : "transparent"}
          marginLeft={segment?.isStart ? 6 : 0}
          marginRight={segment?.isEnd ? 6 : 0}
          borderTopLeftRadius={segment?.isStart ? 3 : 0}
          borderBottomLeftRadius={segment?.isStart ? 3 : 0}
          borderTopRightRadius={segment?.isEnd ? 3 : 0}
          borderBottomRightRadius={segment?.isEnd ? 3 : 0}
        />
      ))}

      <XStack height={6} alignItems="center" justifyContent="center" gap={3}>
        {cell.hasEvent ? <View width={6} height={6} borderRadius={3} backgroundColor={EVENT.from} /> : null}
        {cell.hasTraining ? <View width={6} height={6} borderRadius={1.5} backgroundColor={TRAINING.tint} /> : null}
      </XStack>
    </YStack>
  );
}

function CalendarItemRow({ row }: { row: CalendarRow }) {
  const badge = row.badge ? resolveListAccent(row.badge.accent) : null;

  return (
    <XStack
      role={row.onPress ? "button" : "listitem"}
      aria-label={row.badge ? `${row.title}, ${row.badge.label}` : row.title}
      onPress={row.onPress}
      pressStyle={row.onPress ? { opacity: 0.85 } : undefined}
      alignItems="center"
      gap={14}
      paddingVertical={14}
      paddingHorizontal={16}
    >
      <View opacity={row.cancelled ? 0.5 : 1}>
        <ListIcon icon={row.kind === "event" ? CalendarDays : Repeat} accent={row.kind === "event" ? "events" : "trainings"} />
      </View>
      <YStack flex={1} minWidth={0} gap={3}>
        <XStack alignItems="center" gap={8} minWidth={0}>
          <Text
            flexShrink={1}
            fontSize="$rowTitle"
            fontWeight="$rowTitle"
            color={row.cancelled ? neutral.placeholder : "$neutralText"}
            textDecorationLine={row.cancelled ? "line-through" : "none"}
            numberOfLines={1}
          >
            {row.title}
          </Text>
          {row.badge && badge ? (
            <View flexShrink={0} paddingVertical={2} paddingHorizontal={8} borderRadius="$chip" backgroundColor={badge.fill}>
              <Text fontSize={11} fontWeight="$button" color={badge.tint} numberOfLines={1}>
                {row.badge.label}
              </Text>
            </View>
          ) : null}
        </XStack>
        <Text fontSize="$secondary" fontWeight="$secondary" color="$neutralMuted" numberOfLines={1}>
          {row.meta}
        </Text>
      </YStack>
    </XStack>
  );
}
