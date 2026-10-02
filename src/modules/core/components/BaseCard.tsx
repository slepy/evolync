import React from "react";
import { Card, type CardProps } from "tamagui";

// ============================================================================
// Types
// ============================================================================

export interface BaseCardProps extends Omit<CardProps, "onPress"> {
  /**
   * Handler called when card is pressed
   */
  onPress?: () => void;
  /**
   * Card content
   */
  children: React.ReactNode;
}

// ============================================================================
// BaseCard Component
// ============================================================================

/**
 * Reusable card component with consistent press/hover animations.
 *
 * Use this as a base for all interactive card components in the app.
 * Provides standardized styling for:
 * - Press animation (scale + opacity)
 * - Hover state (border highlight)
 * - Consistent padding, margins, and border styling
 *
 * @example
 * ```tsx
 * <BaseCard onPress={handlePress}>
 *   <XStack gap="$3" alignItems="center">
 *     <IconContainer>...</IconContainer>
 *     <YStack>...</YStack>
 *   </XStack>
 * </BaseCard>
 * ```
 */
export const BaseCard: React.FC<BaseCardProps> = ({
  onPress,
  children,
  backgroundColor = "rgba(255, 255, 255, 0.7)",
  borderColor = "$borderColor",
  borderWidth = 1,
  padding = "$2",
  marginVertical = "$1",
  marginHorizontal = "$3",
  ...rest
}) => {
  return (
    <Card
      animation="quick"
      onPress={onPress}
      backgroundColor={backgroundColor}
      borderColor={borderColor}
      borderWidth={borderWidth}
      padding={padding}
      marginVertical={marginVertical}
      marginHorizontal={marginHorizontal}
      {...rest}
    >
      {children}
    </Card>
  );
};
