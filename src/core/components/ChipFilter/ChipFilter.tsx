import { LinearGradient } from "expo-linear-gradient";
import { ScrollView, StyleSheet } from "react-native";
import { Text, XStack } from "tamagui";
import { resolveListAccent, type ListAccent } from "../List/accent";

export interface ChipFilterOption<T extends string> {
  value: T;
  label: string;
}

export interface ChipFilterProps<T extends string> {
  options: ChipFilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Gradient of the selected chip. */
  accent?: ListAccent;
  "aria-label"?: string;
}

/**
 * Category chips above a list (T2 tag filter: All, Guard, Sweeps…), scrolling
 * sideways. Selected: accent gradient with its button text; unselected: card
 * fill, raised border, soft label. Status chips with dots and counts are
 * `StatusFilter`.
 */
export function ChipFilter<T extends string>({ options, value, onChange, accent = "neutral", ...aria }: ChipFilterProps<T>) {
  const a = resolveListAccent(accent);

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
          return (
            <XStack
              key={option.value}
              role="radio"
              aria-checked={selected}
              aria-label={option.label}
              onPress={() => onChange(option.value)}
              pressStyle={{ opacity: 0.85 }}
              alignItems="center"
              height={40}
              paddingHorizontal={16}
              borderRadius={20}
              overflow="hidden"
              borderWidth={1}
              borderColor={selected ? a.from : "$neutralRaisedBorder"}
              backgroundColor={selected ? "transparent" : "$neutralCard"}
            >
              {selected ? (
                <LinearGradient colors={[a.from, a.to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
              ) : null}
              <Text fontSize="$button" fontWeight="$button" color={selected ? a.onGradient : "$neutralSoft"} numberOfLines={1}>
                {option.label}
              </Text>
            </XStack>
          );
        })}
      </XStack>
    </ScrollView>
  );
}
