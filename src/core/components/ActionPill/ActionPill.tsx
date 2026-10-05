import type { LucideIcon } from "lucide-react-native";
import React from "react";
import { Text, XStack } from "tamagui";

export interface ActionPillProps {
  label: string;
  icon: LucideIcon;
  /** Label / icon color. */
  tint: string;
  /** Pill background (the tint at ~16%). */
  fill: string;
  disabled?: boolean;
  onPress: () => void;
}

/** Half-width 52px action pill of a details screen ("Edit" / "Cancel", 10C / 11D); place two in an XStack. */
export function ActionPill({ label, icon: Icon, tint, fill, disabled, onPress }: ActionPillProps) {
  return (
    <XStack
      role="button"
      aria-label={label}
      aria-disabled={disabled}
      onPress={disabled ? undefined : onPress}
      pressStyle={disabled ? undefined : { opacity: 0.8 }}
      opacity={disabled ? 0.6 : 1}
      flex={1}
      height={52}
      borderRadius={26}
      backgroundColor={fill}
      alignItems="center"
      justifyContent="center"
      gap={8}
    >
      <Icon size={18} color={tint} strokeWidth={2.2} />
      <Text fontSize={15} fontWeight="$button" color={tint}>
        {label}
      </Text>
    </XStack>
  );
}
