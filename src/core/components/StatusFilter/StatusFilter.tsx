import { ScrollView } from "react-native";
import { Text, View, XStack } from "tamagui";
import type { ListAccent } from "../List/accent";
import { resolveStatusColor, type StatusColor } from "../StatusBadge/statusColor";

export interface StatusFilterOption<T extends string> {
  value: T;
  label: string;
  /** Status color. Without one (All / Open) the chip has no dot and takes `accent` when selected. */
  color?: StatusColor;
  /** Number in the circle; hidden when `showCounts` is false. */
  count?: number;
}

export interface StatusFilterProps<T extends string> {
  options: StatusFilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Selected color of options without a status color (the module accent). */
  accent?: ListAccent;
  /** false: label-only chips (board S section 9, "Without counts"). */
  showCounts?: boolean;
  "aria-label"?: string;
}

/**
 * Status chips above a list (board S section 9, 12A), scrolling sideways.
 * Selected: status fill, border and label in the status color, count circle
 * filled with it. Unselected: page fill, muted label, dot in the status color
 * on the left, neutral count circle.
 */
export function StatusFilter<T extends string>({
  options,
  value,
  onChange,
  accent = "neutral",
  showCounts = true,
  ...aria
}: StatusFilterProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0, marginHorizontal: -20 }}
      contentContainerStyle={{ paddingHorizontal: 20 }}
    >
      <XStack role="radiogroup" aria-label={aria["aria-label"]} gap={8}>
        {options.map((option) => {
          const selected = option.value === value;
          const c = resolveStatusColor(option.color ?? accent);
          const count = showCounts ? option.count : undefined;
          return (
            <XStack
              key={option.value}
              role="radio"
              aria-checked={selected}
              aria-label={count === undefined ? option.label : `${option.label}, ${count}`}
              onPress={() => onChange(option.value)}
              pressStyle={{ opacity: 0.85 }}
              alignItems="center"
              gap={7}
              height={40}
              paddingLeft={14}
              paddingRight={count === undefined ? 14 : 10}
              borderRadius={20}
              borderWidth={1}
              borderColor={selected ? c.tint : "$neutralRaisedBorder"}
              backgroundColor={selected ? c.fill : "$neutralPage"}
            >
              {!selected && option.color ? (
                <View width={7} height={7} borderRadius={4} backgroundColor={c.tint} />
              ) : null}
              <Text fontSize={13.5} fontWeight="$button" color={selected ? c.tint : "$neutralMuted"} numberOfLines={1}>
                {option.label}
              </Text>
              {count === undefined ? null : (
                <XStack
                  minWidth={20}
                  height={20}
                  paddingHorizontal={6}
                  borderRadius={10}
                  alignItems="center"
                  justifyContent="center"
                  backgroundColor={selected ? c.tint : "$neutralCardBorder"}
                >
                  <Text fontSize={12} fontWeight="$button" color={selected ? "$neutralPage" : "$neutralTint"}>
                    {count}
                  </Text>
                </XStack>
              )}
            </XStack>
          );
        })}
      </XStack>
    </ScrollView>
  );
}
