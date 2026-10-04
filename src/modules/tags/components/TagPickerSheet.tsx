import { PrimaryButton, TextField } from "@/core/components";
import { moduleAccents } from "@/core/theme/tokens";
import { useStore } from "@/store";
import { Plus } from "lucide-react-native";
import React, { useState } from "react";
import { Button, Sheet, Text, XStack, YStack } from "tamagui";
import { useTags } from "../hooks";
import { createTag } from "../services";
import type { TaggableType } from "../types";
import { FilterChip } from "@/modules/core/components";

interface TagPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taggableType: TaggableType;
  selectedTagIds: string[];
  onToggleTag: (tagId: string) => void;
}

export const TagPickerSheet: React.FC<TagPickerSheetProps> = ({
  open,
  onOpenChange,
  selectedTagIds,
  onToggleTag,
}) => {
  const { user } = useStore();
  const { tags } = useTags();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleCreateTag = async () => {
    if (!newTagName.trim() || !user) return;
    try {
      setIsSaving(true);
      const tag = await createTag({
        userId: user.id,
        name: newTagName.trim(),
        color: moduleAccents.tags.tint,
      });
      onToggleTag(tag.id);
      setNewTagName("");
      setShowCreateForm(false);
    } catch (err) {
      console.error("[TagPickerSheet] createTag:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setNewTagName("");
  };

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[55]}
      dismissOnSnapToBottom
      zIndex={99}
    >
      <Sheet.Overlay
        backgroundColor="rgba(0,0,0,0.5)"
        opacity={0.5}
        zIndex={98}
      />
      <Sheet.Frame
        padding="$4"
        backgroundColor="$background"
        borderTopLeftRadius="$6"
        borderTopRightRadius="$6"
        zIndex={99}
      >
        <Sheet.Handle />
        <YStack gap="$3" paddingTop="$2">
          <Text fontSize="$6" fontWeight="700" color="$textPrimary">
            {t("tagsPicker")}
          </Text>

          {tags.length > 0 && (
            <XStack flexWrap="wrap" gap="$2">
              {tags.map((tag) => (
                <FilterChip
                  key={tag.id}
                  label={tag.name}
                  color={tag.color}
                  onPress={() => onToggleTag(tag.id)}
                  active={selectedTagIds.includes(tag.id)}
                  onRemove={
                    selectedTagIds.includes(tag.id)
                      ? () => onToggleTag(tag.id)
                      : undefined
                  }
                />
              ))}
            </XStack>
          )}

          {showCreateForm ? (
            <YStack gap="$3">
              <TextField
                label={t("fieldName")}
                value={newTagName}
                onChangeText={setNewTagName}
                placeholder={t("tagsNewTagName")}
                accent="tags"
                maxLength={30}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleCreateTag}
              />
              <XStack gap="$2" alignItems="center">
                <Button size="$4" variant="outlined" borderRadius={26} height={52} onPress={handleCancel}>
                  {t("cancel")}
                </Button>
                <YStack flex={1}>
                  <PrimaryButton
                    label={t("create")}
                    accent="tags"
                    onPress={handleCreateTag}
                    disabled={!newTagName.trim()}
                    loading={isSaving}
                  />
                </YStack>
              </XStack>
            </YStack>
          ) : (
            <Button
              size="$3"
              variant="outlined"
              icon={<Plus size={16} pointerEvents="none" />}
              onPress={() => setShowCreateForm(true)}
              alignSelf="flex-start"
            >
              {t("tagsCreateNew")}
            </Button>
          )}
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
};
