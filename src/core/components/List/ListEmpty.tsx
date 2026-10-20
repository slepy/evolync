import { Text, YStack } from "tamagui";

export interface ListEmptyProps {
  text: string;
  hint?: string;
}

/** Empty state in place of a list card: a card-shaped box with a muted line and an optional hint. */
export function ListEmpty({ text, hint }: ListEmptyProps) {
  return (
    <YStack
      gap={4}
      padding={20}
      borderRadius="$card"
      borderWidth={1}
      borderColor="$neutralCardBorder"
      backgroundColor="$neutralCard"
    >
      <Text fontSize={15} fontWeight="$rowTitle" color="$neutralText" textAlign="center">
        {text}
      </Text>
      {hint ? (
        <Text fontSize="$secondary" fontWeight="$secondary" color="$neutralMuted" textAlign="center">
          {hint}
        </Text>
      ) : null}
    </YStack>
  );
}
