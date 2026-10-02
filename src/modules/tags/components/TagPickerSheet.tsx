import { useStore } from "@/store";
import { Plus } from "lucide-react-native";
import React, { useState } from "react";
import { Button, Input, Sheet, Text, XStack, YStack, useTheme } from "tamagui";
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
  const theme = useTheme();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const defaultColor = theme.chineseCyan?.val ?? "#0891B2";

  const handleCreateTag = async () => {
    if (!newTagName.trim() || !user) return;
    try {
      setIsSaving(true);
      const tag = await createTag({
        userId: user.id,
        name: newTagName.trim(),
        color: defaultColor,
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
            <YStack gap="$2">
              <XStack gap="$2" alignItems="center">
                <Input
                  flex={1}
                  size="$3"
                  placeholder={t("tagsNewTagName")}
                  value={newTagName}
                  onChangeText={setNewTagName}
                  autoFocus
                />
                <Button
                  size="$3"
                  theme="active"
                  onPress={handleCreateTag}
                  disabled={!newTagName.trim() || isSaving}
                  opacity={!newTagName.trim() || isSaving ? 0.6 : 1}
                >
                  {t("save")}
                </Button>
                <Button size="$3" variant="outlined" onPress={handleCancel}>
                  {t("cancel")}
                </Button>
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
