import { contextColors, neutral, type ContextKey } from "@/core/theme/tokens";
import { Spinner, Text, View, XStack, YStack } from "tamagui";
import { ListCard } from "../List/ListCard";
import { ListSection } from "../List/ListSection";
import type { CalendarDayCell, CalendarFilter } from "./calendarMonth";
import type { CalendarRow } from "./types";
import { FilterChips } from "./FilterChips";
import { MonthButton } from "./MonthButton";
import { DayCell } from "./DayCell";
import { CalendarItemRow } from "./CalendarItemRow";

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
