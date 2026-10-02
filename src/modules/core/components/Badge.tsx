import React from "react";
import { Text, XStack } from "tamagui";

export interface BadgeProps {
  title: string;
  backgroundColor?: string;
  textColor?: string;
}

export function Badge({
  title = "",
  backgroundColor = "$fillMuted",
  textColor = "$textPrimary",
}: BadgeProps) {
  return (
    <XStack
      backgroundColor={backgroundColor}
      paddingHorizontal="$2"
      paddingVertical="$1"
      borderRadius="$2"
    >
      <Text fontSize="$2" color={textColor} fontWeight="600">
        {title}
      </Text>
    </XStack>
  );
}
