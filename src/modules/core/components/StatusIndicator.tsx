import React from "react";
import { XStack, useTheme } from "tamagui";

export interface StatusIndicatorProps {
  icon?: React.ReactNode;
  color?: string;
  onPress?: () => void;
}

export function StatusIndicator({
  icon,
  color,
  onPress = () => {},
}: StatusIndicatorProps) {
  const theme = useTheme();

  if (!icon || !color) {
    return null;
  }

  return (
    <XStack
      width={40}
      height={40}
      backgroundColor={color}
      borderRadius="$5"
      justifyContent="center"
      alignItems="center"
      onPress={onPress}
    >
      {React.isValidElement(icon) &&
        React.cloneElement(icon as React.ReactElement<any>, {
          ...(icon.props || {}),
          size: 20,
          color: theme.pearlWhite?.val, // Using theme token value like original
          strokeWidth: 2.5,
          pointerEvents: "none",
        })}
    </XStack>
  );
}
