import { getContrastColor } from "@/modules/core/utils/colorHelper";
import { X } from "lucide-react-native";
import React from "react";
import { TouchableOpacity } from "react-native";
import { Text, XStack, useTheme } from "tamagui";

export interface FilterChipProps {
  label: string;
  /** Custom hex color. When omitted, chip uses blue (active) / gray (inactive) toggle style. */
  color?: string;
  onRemove?: () => void;
  onPress?: () => void;
  active?: boolean;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  color,
  onRemove,
  onPress,
  active,
}) => {
  const theme = useTheme();

  const resolvedColor =
    color ??
    (active === false
      ? (theme.fillSubtle?.val ?? "#E2E8F0")
      : (theme.darkBlueLight?.val ?? "#3B82F6"));

  const textColor = getContrastColor(resolvedColor);
  const opacity = color !== undefined && active === false ? 0.4 : 1;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ opacity }}>
      <XStack
        alignItems="center"
        gap="$1"
        paddingHorizontal="$2"
        paddingVertical="$1"
        borderRadius="$10"
        backgroundColor={resolvedColor}
      >
        <Text
          fontSize="$2"
          fontWeight="600"
          color={textColor}
          numberOfLines={1}
        >
          {label}
        </Text>
        {onRemove && (
          <TouchableOpacity onPress={onRemove} hitSlop={8}>
            <X size={12} color={textColor} pointerEvents="none" />
          </TouchableOpacity>
        )}
      </XStack>
    </TouchableOpacity>
  );
};
