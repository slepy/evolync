import React from "react";
import { Text, XStack } from "tamagui";
import { getContrastColor } from "@/modules/core/utils/colorHelper";

interface RankBadgeProps {
  name?: string | null;
  color?: string | null;
  size?: "small" | "medium";
}

export const RankBadge: React.FC<RankBadgeProps> = ({
  name,
  color,
  size = "medium",
}) => {
  if (!name) {
    return (
      <Text color="$textSecondary" fontSize={size === "small" ? "$2" : "$3"}>
        {t("gradingNoRank")}
      </Text>
    );
  }

  const textColor = color ? getContrastColor(color) : "$textPrimary";

  return (
    <XStack
      alignItems="center"
      gap="$2"
      paddingHorizontal="$2"
      paddingVertical="$1"
      borderRadius="$2"
      backgroundColor={color ?? "$fillStrong"}
    >
      <Text
        color={textColor}
        fontSize={size === "small" ? "$2" : "$3"}
        fontWeight="500"
      >
        {name}
      </Text>
    </XStack>
  );
};
