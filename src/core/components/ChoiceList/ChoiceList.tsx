import { LinearGradient } from "expo-linear-gradient";
import { Check } from "lucide-react-native";
import { StyleSheet } from "react-native";
import { Text, View, XStack, YStack } from "tamagui";
import { resolveListAccent, type ListAccent } from "../List/accent";

export interface ChoiceOption<T extends string> {
  value: T;
  title: string;
  /** Muted line under the title ("All schools and members", the chosen school). */
  hint?: string;
  /** 8px dot in this color before the title (12C: the order status). */
  dot?: ListAccent;
}

export interface ChoiceListProps<T extends string> {
  /** Group title above the rows ("Who is it for?"). */
  title?: string;
  /** Accessible name of the group when it has no visible title (17A: the card title). */
  label?: string;
  options: ChoiceOption<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  accent?: ListAccent;
  error?: string;
  disabled?: boolean;
  /** Fill of the unselected rows: "card" (default) on the page, "page" inside a card (17A Language). */
  surface?: "card" | "page";
}

/**
 * Radio choice list (board S, 10A / 11A "Who is it for?"): one answer from
 * 2–5 options (12C: order status). 56px rows with a round radio on the left, title and hint;
 * the selected row has a 1.5px border and 8% fill in the module accent.
 */
export function ChoiceList<T extends string>({
  title,
  label,
  options,
  value,
  onChange,
  accent = "neutral",
  error,
  disabled,
  surface = "card",
}: ChoiceListProps<T>) {
  const a = resolveListAccent(accent);

  return (
    <YStack gap={10} role="radiogroup" aria-label={title ?? label}>
      {title ? (
        <Text fontSize={18} fontWeight="$section" color="$neutralText">
          {title}
        </Text>
      ) : null}
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <XStack
            key={option.value}
            role="radio"
            aria-checked={selected}
            aria-label={option.hint ? `${option.title}, ${option.hint}` : option.title}
            onPress={disabled ? undefined : () => onChange(option.value)}
            pressStyle={disabled ? undefined : { opacity: 0.85 }}
            opacity={disabled ? 0.6 : 1}
            alignItems="center"
            gap={12}
            minHeight={56}
            paddingVertical={8}
            paddingHorizontal={14}
            borderRadius={16}
            borderWidth={selected ? 1.5 : 1}
            borderColor={selected ? a.tint : "$neutralRaisedBorder"}
            backgroundColor={selected ? a.selectedFill : surface === "page" ? "$neutralPage" : "$neutralCard"}
          >
            {/* Same view tree in both states, only opacity changes (see ListCheckbox). */}
            <View width={24} height={24} borderRadius={12} overflow="hidden" alignItems="center" justifyContent="center" flexShrink={0}>
              <LinearGradient
                colors={[a.from, a.to]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill, { opacity: selected ? 1 : 0 }]}
              />
              <View
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                borderRadius={12}
                borderWidth={1.5}
                borderColor="$neutralControl"
                opacity={selected ? 0 : 1}
              />
              <View opacity={selected ? 1 : 0}>
                <Check size={14} color={a.onGradient} strokeWidth={3} />
              </View>
            </View>
            <YStack flex={1} minWidth={0} gap={2}>
              <XStack alignItems="center" gap={8}>
                {option.dot ? (
                  <View width={8} height={8} borderRadius={4} backgroundColor={resolveListAccent(option.dot).tint} flexShrink={0} />
                ) : null}
                <Text flexShrink={1} fontSize={15} fontWeight="$rowTitle" color="$neutralText" numberOfLines={1}>
                  {option.title}
                </Text>
              </XStack>
              {option.hint ? (
                <Text fontSize={12.5} fontWeight="$secondary" color="$neutralMuted" numberOfLines={1}>
                  {option.hint}
                </Text>
              ) : null}
            </YStack>
          </XStack>
        );
      })}
      {error ? (
        <Text fontSize={12.5} fontWeight="$secondary" color="$trashText">
          {error}
        </Text>
      ) : null}
    </YStack>
  );
}
