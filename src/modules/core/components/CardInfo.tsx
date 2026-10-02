import React from "react";
import { Text, YStack, type YStackProps } from "tamagui";

// ============================================================================
// Types
// ============================================================================

export interface CardInfoProps extends Omit<YStackProps, "children"> {
  displayName: string;
  subtitle?: string | null;
  reverseTitles?: boolean;
}

// ============================================================================
// CardInfo Component
// ============================================================================

export const CardInfo: React.FC<CardInfoProps> = ({
  displayName,
  subtitle,
  reverseTitles = false,
  ...props
}) => {
  return (
    <YStack flex={1} pointerEvents="none" {...props}>
      {reverseTitles && (
        <>
          {subtitle && (
            <Text fontSize="$2" color="$textMuted">
              {subtitle}
            </Text>
          )}
        </>
      )}

      <Text fontSize="$4" fontWeight="600" color="$textPrimary">
        {displayName}
      </Text>

      {!reverseTitles && (
        <>
          {subtitle && (
            <Text fontSize="$2" color="$textMuted">
              {subtitle}
            </Text>
          )}
        </>
      )}
    </YStack>
  );
};
