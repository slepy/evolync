import React, { forwardRef } from "react";
import type { ColorTokens, TamaguiElement } from "tamagui";
import { Text, XStack, YStack, useTheme } from "tamagui";

export interface MiniStatProps {
  icon?: React.ElementType;
  value: number | string;
  color: ColorTokens;
  label: string;
  pressable?: boolean;
}

export const MiniStat = forwardRef<TamaguiElement, MiniStatProps>(
  ({ icon: Icon, value, color, label, pressable = false, ...props }, ref) => {
    const theme = useTheme();
    const colorStr = color as string;
    const resolvedColor = colorStr.startsWith("$")
      ? theme[colorStr.slice(1)]?.val || colorStr
      : colorStr;
    const IconComponent = Icon as
      | React.ComponentType<{
          size: number;
          color: string;
        }>
      | undefined;

    return (
      <YStack
        ref={ref}
        alignItems="center"
        pressStyle={pressable ? { opacity: 0.7 } : undefined}
        {...props}
      >
        <XStack alignItems="center" gap="$1.5">
          {IconComponent && <IconComponent size={18} color={resolvedColor} />}
          <Text fontSize="$5" fontWeight="700" color={color}>
            {value}
          </Text>
        </XStack>
        <Text fontSize={10} color="$textSecondary">
          {label}
        </Text>
      </YStack>
    );
  },
);
