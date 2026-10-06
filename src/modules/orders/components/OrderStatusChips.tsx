import { neutral } from "@/core/theme/tokens";
import React from "react";
import { ScrollView } from "react-native";
import { Text, View, XStack } from "tamagui";

export interface StatusChip<K extends string> {
  key: K;
  label: string;
  count: number;
  tint: string;
  fill: string;
  /** Status dot in front of the label ("Open" / "To order" have none). */
  dot?: boolean;
}

interface OrderStatusChipsProps<K extends string> {
  chips: StatusChip<K>[];
  value: K;
  onChange: (value: K) => void;
  "aria-label": string;
}

/**
 * Status chips with counts (12A / 12B): 40px pills, dot + label + count
 * bubble. The chosen chip has a 1px tint border, tint fill and a solid
 * count bubble; the others sit on the page fill.
 */
export function OrderStatusChips<K extends string>({ chips, value, onChange, ...aria }: OrderStatusChipsProps<K>) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
      <XStack role="radiogroup" aria-label={aria["aria-label"]} gap={8}>
        {chips.map((chip) => {
          const on = chip.key === value;
          return (
            <XStack
              key={chip.key}
              role="radio"
              aria-checked={on}
              aria-label={`${chip.label}, ${chip.count}`}
              onPress={() => onChange(chip.key)}
              pressStyle={{ opacity: 0.85 }}
              flexShrink={0}
              alignItems="center"
              gap={7}
              height={40}
              paddingLeft={14}
              paddingRight={10}
              borderRadius={20}
              borderWidth={1}
              borderColor={on ? chip.tint : "$neutralRaisedBorder"}
              backgroundColor={on ? chip.fill : "$neutralPage"}
            >
              {chip.dot ? <View width={7} height={7} borderRadius={4} backgroundColor={chip.tint} /> : null}
              <Text fontSize={13.5} fontWeight="$button" color={on ? chip.tint : "$neutralMuted"} numberOfLines={1}>
                {chip.label}
              </Text>
              <XStack
                minWidth={20}
                height={20}
                paddingHorizontal={6}
                borderRadius={10}
                alignItems="center"
                justifyContent="center"
                backgroundColor={on ? chip.tint : "$neutralCardBorder"}
              >
                <Text fontSize={12} fontWeight="$button" color={on ? neutral.page : neutral.tint}>
                  {chip.count}
                </Text>
              </XStack>
            </XStack>
          );
        })}
      </XStack>
    </ScrollView>
  );
}

/** Status pill of a row / the details card: dot + label in the status color. */
export function OrderStatusPill({ label, tint, fill, size = "sm" }: { label: string; tint: string; fill: string; size?: "sm" | "md" }) {
  const md = size === "md";
  return (
    <XStack
      alignItems="center"
      gap={md ? 6 : 5}
      paddingVertical={md ? 5 : 3}
      paddingHorizontal={md ? 10 : 8}
      borderRadius={md ? 10 : 9}
      backgroundColor={fill}
      flexShrink={0}
    >
      <View width={md ? 7 : 6} height={md ? 7 : 6} borderRadius={4} backgroundColor={tint} />
      <Text fontSize={md ? 13 : 11.5} fontWeight="$button" color={tint} numberOfLines={1}>
        {label}
      </Text>
    </XStack>
  );
}
