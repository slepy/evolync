import { Text, View, XStack, YStack } from "tamagui";
import { resolveListAccent, type ListAccent } from "../List/accent";

export interface StepListProps {
  /** 16/800 card title ("How it works"). */
  title: string;
  /** One line per step, numbered from 1. */
  steps: string[];
  /** Colors the number circles. */
  accent?: ListAccent;
}

/**
 * Numbered steps in a card (Join a school "How it works"): title, then a
 * 28px circle with the number in the accent next to each muted line.
 */
export function StepList({ title, steps, accent = "neutral" }: StepListProps) {
  const a = resolveListAccent(accent);

  return (
    <YStack
      gap={12}
      padding={16}
      borderRadius="$card"
      backgroundColor="$neutralCard"
      borderWidth={1}
      borderColor="$neutralCardBorder"
    >
      <Text fontSize="$rowTitle" fontWeight="$rowTitle" color="$neutralText">
        {title}
      </Text>
      {steps.map((step, index) => (
        <XStack key={step} alignItems="center" gap={12}>
          <View
            width={28}
            height={28}
            borderRadius={14}
            backgroundColor={a.fill}
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
          >
            <Text fontSize={13} fontWeight="$button" color={a.tint}>
              {index + 1}
            </Text>
          </View>
          <Text flex={1} fontSize={14} fontWeight="600" lineHeight={20} color="$neutralMuted">
            {step}
          </Text>
        </XStack>
      ))}
    </YStack>
  );
}
