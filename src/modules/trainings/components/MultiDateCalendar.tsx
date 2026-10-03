import { FilterChip } from "@/modules/core/components";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { Button, Text, XStack, YStack, useTheme } from "tamagui";
import { buildMonthGrid, toggleDay } from "./calendarGrid";
import { WEEKDAYS_MONDAY_FIRST, formatDay, formatMonth, weekdayShort } from "./format";

interface MultiDateCalendarProps {
  selected: string[]; // "YYYY-MM-DD"
  onChange: (days: string[]) => void;
  /** Earliest selectable day (today); earlier days are disabled. */
  minDay: string;
  /** Cap on selected days (1 = picking a day replaces the current one). */
  maxDates?: number;
  error?: string;
  disabled?: boolean;
}

const monthOf = (day: string) => {
  const [y, m] = day.split("-").map(Number);
  return { year: y, month: m - 1 };
};

/** Month grid with multi-select; selected days are listed as removable chips. */
export const MultiDateCalendar: React.FC<MultiDateCalendarProps> = ({
  selected,
  onChange,
  minDay,
  maxDates,
  error,
  disabled = false,
}) => {
  const theme = useTheme();
  const [view, setView] = useState(() => monthOf([...selected].sort()[0] ?? minDay));
  const min = monthOf(minDay);
  const canGoBack = view.year > min.year || (view.year === min.year && view.month > min.month);
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const rows = useMemo(() => buildMonthGrid(view.year, view.month, minDay), [view, minDay]);

  const shift = (delta: number) =>
    setView(({ year, month }) => {
      const next = new Date(Date.UTC(year, month + delta, 1));
      return { year: next.getUTCFullYear(), month: next.getUTCMonth() };
    });

  const toggle = (day: string) => {
    if (disabled) return;
    onChange(toggleDay(selected, day, minDay, maxDates));
  };

  return (
    <YStack gap="$2">
      <YStack
        borderWidth={2}
        borderColor={error ? "$imperialRed" : "$borderStrong"}
        borderRadius="$4"
        padding="$2"
        gap="$1"
        backgroundColor="$background"
      >
        <XStack alignItems="center" justifyContent="space-between">
          <Button size="$3" chromeless circular disabled={!canGoBack} opacity={canGoBack ? 1 : 0.3} onPress={() => shift(-1)}>
            <ChevronLeft size={20} color={theme.textPrimary?.val} />
          </Button>
          <Text fontSize="$4" fontWeight="600" color="$textPrimary">
            {formatMonth(view.year, view.month)}
          </Text>
          <Button size="$3" chromeless circular onPress={() => shift(1)}>
            <ChevronRight size={20} color={theme.textPrimary?.val} />
          </Button>
        </XStack>

        <XStack>
          {WEEKDAYS_MONDAY_FIRST.map((weekday) => (
            <Text key={weekday} flex={1} textAlign="center" fontSize="$2" color="$textMuted">
              {weekdayShort(weekday)}
            </Text>
          ))}
        </XStack>

        {rows.map((row, r) => (
          <XStack key={r}>
            {row.map((cell, c) => {
              if (!cell) return <YStack key={c} flex={1} height={38} />;
              const { day, disabled: isPast } = cell;
              const isSelected = selectedSet.has(day);
              return (
                <YStack
                  key={day}
                  flex={1}
                  height={38}
                  margin={1}
                  borderRadius="$3"
                  alignItems="center"
                  justifyContent="center"
                  backgroundColor={isSelected ? "$chineseGold" : "transparent"}
                  opacity={isPast ? 0.3 : 1}
                  pressStyle={isPast || disabled ? undefined : { scale: 0.92 }}
                  onPress={() => toggle(day)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected, disabled: isPast }}
                >
                  <Text
                    fontSize="$3"
                    fontWeight={isSelected ? "700" : "400"}
                    color={isSelected ? "$pearlWhite" : "$textPrimary"}
                  >
                    {Number(day.slice(8))}
                  </Text>
                </YStack>
              );
            })}
          </XStack>
        ))}
      </YStack>

      {selected.length > 0 && (
        <XStack gap="$2" flexWrap="wrap">
          {[...selected].sort().map((day) => (
            <FilterChip key={day} label={formatDay(day)} onRemove={disabled ? undefined : () => toggle(day)} />
          ))}
        </XStack>
      )}
      {error && (
        <Text color="$imperialRed" fontSize="$3">
          {error}
        </Text>
      )}
    </YStack>
  );
};
