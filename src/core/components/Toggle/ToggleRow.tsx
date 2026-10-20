import { Text, XStack, YStack } from "tamagui";
import { type ToggleProps, Toggle } from "./Toggle";

export interface ToggleRowProps extends ToggleProps {
  /** 16/800 row title ("Push notifications"). */
  title: string;
  /** Line under the title; `hintTone="danger"` paints it red (17B blocked). */
  hint?: string;
  hintTone?: "muted" | "danger";
}

/** Setting row: title and hint on the left, `Toggle` on the right (17A / 17B). */
export function ToggleRow({ title, hint, hintTone = "muted", ...toggle }: ToggleRowProps) {
  return (
    <XStack alignItems="center" gap={14} minHeight={56}>
      <YStack flex={1} minWidth={0} gap={3}>
        <Text fontSize="$rowTitle" fontWeight="$rowTitle" color="$neutralText">
          {title}
        </Text>
        {hint ? (
          <Text
            fontSize={13}
            fontWeight="$secondary"
            lineHeight={19}
            color={hintTone === "danger" ? "$trashText" : "$neutralMuted"}
          >
            {hint}
          </Text>
        ) : null}
      </YStack>
      <Toggle {...toggle} />
    </XStack>
  );
}
