import { neutral } from "@/core/theme/tokens";
import { Text, View, XStack } from "tamagui";
import { withAlpha } from "../List/accent";
import type { CalendarFilter } from "./calendarMonth";
import { EVENT, TRAINING } from "./calendarColors";

export interface FilterChipsProps {
  value: CalendarFilter;
  onChange: (filter: CalendarFilter) => void;
}

export function FilterChips({ value, onChange }: FilterChipsProps) {
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
