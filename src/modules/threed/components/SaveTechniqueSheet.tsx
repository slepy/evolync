import React, { useState } from "react";
import { Button, Text, YStack, XStack } from "tamagui";
import { X } from "lucide-react-native";
import { TextInput, SubmitComponent } from "@/modules/core/components";
import { THREED_TITLE_MAX } from "../validation";

interface SaveTechniqueSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bodyPart: string | null;
  /** Saves the technique; a rejection keeps the sheet open with the error under the name. */
  onSave: (title: string) => Promise<void> | void;
}

export const SaveTechniqueSheet: React.FC<SaveTechniqueSheetProps> = ({
  open,
  onOpenChange,
  bodyPart,
  onSave,
}) => {
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    setError(undefined);
    try {
      await onSave(title.trim());
      setTitle("");
      onOpenChange(false);
    } catch (err) {
      console.error("[SaveTechniqueSheet] save:", err);
      setError(t(err instanceof Error ? err.message : "errorSaveFailed"));
    } finally {
      setSaving(false);
    }
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
            <Text fontSize="$5" fontWeight="700" color="$textPrimary">
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
            <Text fontSize="$3" color="$textSecondary">
              {bodyPart}
            </Text>
          )}

          <TextInput
            value={title}
            onChangeText={(value) => {
              setTitle(value);
              setError(undefined);
            }}
            placeholder={t("threedTechniqueTitle")}
            label={t("fieldName")}
            maxLength={THREED_TITLE_MAX}
            error={error}
          />
        </YStack>
      </YStack>

      {/* Submit button at bottom */}
      <SubmitComponent
        onPress={handleSave}
        isLoading={saving}
        disabled={!title.trim()}
        title={t("save")}
      />
    </YStack>
  );
};
