import React, { useState } from "react";
import { Button, Text, YStack, XStack } from "tamagui";
import { X } from "lucide-react-native";
import { TextInput, SubmitComponent } from "@/modules/core/components";

interface SaveTechniqueSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bodyPart: string | null;
  onSave: (title: string) => void;
}

export const SaveTechniqueSheet: React.FC<SaveTechniqueSheetProps> = ({
  open,
  onOpenChange,
  bodyPart,
  onSave,
}) => {
  const [title, setTitle] = useState("");

  const handleSave = () => {
    if (!title.trim()) return;
    onSave(title.trim());
    setTitle("");
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <YStack
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      backgroundColor="$background"
      zIndex={999}
      flex={1}
    >
      {/* Content area with scrollable form */}
      <YStack
        flex={1}
        padding="$4"
        justifyContent="center"
        alignItems="center"
      >
        <YStack
          width="100%"
          maxWidth={400}
          gap="$4"
        >
          {/* Header with close button */}
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$5" fontWeight="700" color="$inkBlack">
              {t("threedSaveTechnique")}
            </Text>
            <Button
              size="$2"
              icon={<X size={20} />}
              chromeless
              onPress={() => onOpenChange(false)}
            />
          </XStack>

          {bodyPart && (
            <Text fontSize="$3" color="$softGrayDark">
              {bodyPart}
            </Text>
          )}

          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t("threedTechniqueTitle")}
            label={t("fieldName")}
          />
        </YStack>
      </YStack>

      {/* Submit button at bottom */}
      <SubmitComponent
        onPress={handleSave}
        isLoading={false}
        disabled={!title.trim()}
        title={t("save")}
      />
    </YStack>
  );
};
