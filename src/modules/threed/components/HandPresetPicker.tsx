import React from "react";
import { ScrollView } from "react-native";
import { Sheet, Text, YStack } from "tamagui";
import { BaseCard } from "@/modules/core/components";
import type BodyPosePreset from "@/database/models/BodyPosePreset";

interface HandPresetPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presets: BodyPosePreset[];
  onSelect: (presetId: string) => void;
}

export const HandPresetPicker: React.FC<HandPresetPickerProps> = ({
  open,
  onOpenChange,
  presets,
  onSelect,
}) => {
  const handleSelect = (presetId: string) => {
    onSelect(presetId);
    onOpenChange(false);
  };

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[50]}
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
          <Text fontSize="$5" fontWeight="700" color="$textPrimary">
            {t("threedSelectHandPreset")}
          </Text>
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
          >
            <YStack gap="$1">
              {presets.map((preset) => (
                <BaseCard
                  key={preset.id}
                  onPress={() => handleSelect(preset.id)}
                  marginHorizontal={0}
                >
                  <Text fontSize="$4" fontWeight="500" color="$textPrimary">
                    {preset.name}
                  </Text>
                </BaseCard>
              ))}
            </YStack>
          </ScrollView>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
};
