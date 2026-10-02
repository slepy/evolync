import {
  OptionsSheet,
  type OptionItem,
} from "@/modules/core/components/OptionsSheet";
import { ChevronsUpDown } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { Pressable } from "react-native";
import { Text, useTheme, XStack } from "tamagui";

// ============================================================================
// Types
// ============================================================================

export interface SelectableOption {
  id: string;
  label: string;
  icon?: React.ComponentType<{ size?: number; color?: string }>;
  iconColor?: string;
}

export interface HeaderTitleProps {
  /** Title text to display */
  text: string;
  /** Optional callback when title is pressed */
  onPress?: () => void;
}

export interface HeaderSelectorProps {
  /** Currently selected option */
  selectedOption: SelectableOption;
  /** List of all available options */
  options: SelectableOption[];
  /** Callback when an option is selected */
  onSelect: (optionId: string) => void;
}

// ============================================================================
// HeaderTitle Component
// ============================================================================

/**
 * Simple title text for Header center content (element #2).
 * Optionally clickable.
 */
export const HeaderTitle: React.FC<HeaderTitleProps> = ({ text, onPress }) => {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={{ width: "100%" }}>
        {({ pressed }) => (
          <XStack
            alignItems="center"
            justifyContent="center"
            opacity={pressed ? 0.7 : 1}
          >
            <Text
              fontSize="$6"
              fontWeight="700"
              color="$textPrimary"
              numberOfLines={1}
            >
              {text}
            </Text>
          </XStack>
        )}
      </Pressable>
    );
  }

  return (
    <Text
      fontSize="$6"
      fontWeight="700"
      color="$textPrimary"
      numberOfLines={1}
      textAlign="center"
    >
      {text}
    </Text>
  );
};

// ============================================================================
// HeaderSelector Component
// ============================================================================

/**
 * Dropdown selector for Header center content (element #2).
 * Shows current selection with dropdown indicator.
 * Opens OptionsSheet on press.
 */
export const HeaderSelector: React.FC<HeaderSelectorProps> = ({
  selectedOption,
  options,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useTheme();

  const sheetOptions: OptionItem[] = useMemo(
    () =>
      options.map((option) => ({
        id: option.id,
        label: option.label,
        icon: option.icon,
        iconColor: option.iconColor,
        isSelected: option.id === selectedOption.id,
        onPress: () => {
          setIsOpen(false);
          onSelect(option.id);
        },
      })),
    [options, selectedOption.id, onSelect],
  );

  return (
    <>
      <Pressable
        onPress={() => options.length > 1 && setIsOpen(true)}
        style={{ width: "100%" }}
      >
        {({ pressed }) => (
          <XStack
            gap="$2"
            alignItems="center"
            justifyContent="center"
            opacity={pressed ? 0.7 : 1}
          >
            <Text
              fontSize="$6"
              fontWeight="700"
              color="$textPrimary"
              numberOfLines={1}
            >
              {selectedOption.label}
            </Text>
            {options.length > 1 && (
              <ChevronsUpDown size={18} color={theme.textPrimary?.val} />
            )}
          </XStack>
        )}
      </Pressable>

      <OptionsSheet
        open={isOpen}
        onOpenChange={setIsOpen}
        options={sheetOptions}
        mode="selection"
        snapPoint={40}
      />
    </>
  );
};
