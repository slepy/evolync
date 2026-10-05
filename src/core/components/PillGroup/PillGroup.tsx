import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { resolveListAccent, withAlpha, type ListAccent } from "../List/accent";

export interface PillOption<T extends string | number> {
  value: T;
  label: string;
  /** Accessible label when the pill shows an abbreviation ("Mo" → "Monday"). */
  ariaLabel?: string;
}

export interface PillGroupProps<T extends string | number> {
  /** Uppercase label above the pills ("REPEATS", "WHICH WEEK"). */
  label?: string;
  options: PillOption<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  accent?: ListAccent;
  /**
   * "segment" (default): pills share the row, the chosen one tinted
   * (Single / Recurring, Weekly / Monthly, 1st…Last).
   * "circle": 44px round pills, the chosen one in the accent gradient (Mo…Su).
   */
  variant?: "segment" | "circle";
  disabled?: boolean;
}

/**
 * Row of 44px pills picking one value (11A / 11B): unselected pills sit on
 * the page fill with the raised border and muted text.
 */
export function PillGroup<T extends string | number>({
  label,
  options,
  value,
  onChange,
  accent = "neutral",
  variant = "segment",
  disabled,
}: PillGroupProps<T>) {
  const a = resolveListAccent(accent);
  const circle = variant === "circle";

  const row = (
    <XStack role="radiogroup" aria-label={label} gap={circle ? 4 : 6} justifyContent={circle ? "space-between" : undefined}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <XStack
            key={String(option.value)}
            role="radio"
            aria-checked={selected}
            aria-label={option.ariaLabel ?? option.label}
            onPress={disabled ? undefined : () => onChange(option.value)}
            pressStyle={disabled ? undefined : { opacity: 0.85 }}
            opacity={disabled ? 0.6 : 1}
            flex={1}
            maxWidth={circle ? 44 : undefined}
            height={44}
            borderRadius={22}
            overflow="hidden"
            alignItems="center"
            justifyContent="center"
            borderWidth={circle && selected ? 0 : 1}
            borderColor={selected ? withAlpha(a.tint, 0.5) : "$neutralRaisedBorder"}
            backgroundColor={selected ? (circle ? "transparent" : a.fill) : "$neutralPage"}
          >
            {circle && selected ? (
              <LinearGradient colors={[a.from, a.to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            ) : null}
            <Text
              fontSize={circle ? 13 : 13.5}
              fontWeight="$button"
              color={selected ? (circle ? a.onGradient : a.tint) : "$neutralMuted"}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </XStack>
        );
      })}
    </XStack>
  );

  if (!label) return row;

  return (
    <YStack gap={8}>
      <Text fontSize={12} fontWeight="$eyebrow" letterSpacing={0.8} textTransform="uppercase" color="$neutralMuted">
        {label}
      </Text>
      {row}
    </YStack>
  );
}
