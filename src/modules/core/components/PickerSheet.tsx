import { Check } from "lucide-react-native";
import React from "react";
import { ScrollView } from "react-native";
import { Circle, Sheet, Text, XStack, YStack, useTheme } from "tamagui";
import { BaseCard } from "./BaseCard";

// ============================================================================
// Types
// ============================================================================

export interface PickerSheetOption {
  id: string;
  label: string;
  color?: string | null;
}

export interface PickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: PickerSheetOption[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  allowNone?: boolean;
  noneLabel?: string;
  snapPoints?: number[];
}

// ============================================================================
// PickerSheet Component
// ============================================================================

export const PickerSheet: React.FC<PickerSheetProps> = ({
  open,
  onOpenChange,
  options,
  selectedId,
  onSelect,
  allowNone = false,
  noneLabel,
  snapPoints = [50],
}) => {
  const handleSelect = (id: string | null) => {
    onSelect(id);
    onOpenChange(false);
  };

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={snapPoints}
      dismissOnSnapToBottom
      zIndex={200}
    >
      <Sheet.Overlay
        backgroundColor="rgba(0, 0, 0, 0.5)"
        opacity={0.5}
        zIndex={199}
      />
      <Sheet.Frame
        padding="$4"
        backgroundColor="$background"
        borderTopLeftRadius="$6"
        borderTopRightRadius="$6"
        zIndex={200}
      >
        <Sheet.Handle />
        <YStack gap="$3" flex={1}>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <YStack gap="$1">
              {allowNone && (
                <PickerOption
                  label={noneLabel || "-"}
                  isSelected={selectedId === null}
                  onPress={() => handleSelect(null)}
                />
              )}
              {options.map((option) => (
                <PickerOption
                  key={option.id}
                  label={option.label}
                  color={option.color}
                  isSelected={selectedId === option.id}
                  onPress={() => handleSelect(option.id)}
                />
              ))}
            </YStack>
          </ScrollView>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
};

// ============================================================================
// PickerOption (internal)
// ============================================================================

interface PickerOptionProps {
  label: string;
  color?: string | null;
  isSelected: boolean;
  onPress: () => void;
}

const PickerOption: React.FC<PickerOptionProps> = ({
  label,
  color,
  isSelected,
  onPress,
}) => {
  const theme = useTheme();

  const borderColor =
    isSelected && color ? color : isSelected ? "$blue11" : "$borderColor";

  const backgroundColor =
    isSelected && color
      ? `${color}33`
      : isSelected
        ? "$blue3"
        : "rgba(255, 255, 255, 0.7)";

  const checkColor = color || theme.blue10?.val;

  return (
    <BaseCard
      onPress={onPress}
      backgroundColor={backgroundColor}
      borderColor={borderColor}
      marginHorizontal={0}
    >
      <XStack justifyContent="space-between" alignItems="center">
        <XStack alignItems="center" gap="$3">
          {color && (
            <Circle
              size={20}
              backgroundColor={color}
              borderWidth={1}
              borderColor="$softGrayDark"
            />
          )}
          <Text
            fontSize="$4"
            fontWeight={isSelected ? "700" : "500"}
            color="$inkBlack"
          >
            {label}
          </Text>
        </XStack>
        {isSelected && <Check size={20} color={checkColor} />}
      </XStack>
    </BaseCard>
  );
};
