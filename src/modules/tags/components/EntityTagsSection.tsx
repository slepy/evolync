import { Plus } from "lucide-react-native";
import React, { useState } from "react";
import { Button, Text, XStack, YStack } from "tamagui";
import { useEntityTags } from "../hooks";
import { setTagsForEntity } from "../services";
import type { TaggableType } from "../types";
import { FilterChip } from "@/modules/core/components";
import { TagPickerSheet } from "./TagPickerSheet";

interface EntityTagsSectionProps {
  taggableId: string;
  taggableType: TaggableType;
  onChanged?: () => void;
}

export const EntityTagsSection: React.FC<EntityTagsSectionProps> = ({
  taggableId,
  taggableType,
  onChanged,
}) => {
  const { tags, tagIds } = useEntityTags(taggableId, taggableType);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingTagIds, setPendingTagIds] = useState<string[] | null>(null);

  const activeTagIds = pendingTagIds ?? tagIds;

  const handleToggleTag = (tagId: string) => {
    const next = activeTagIds.includes(tagId)
      ? activeTagIds.filter((id) => id !== tagId)
      : [...activeTagIds, tagId];
    setPendingTagIds(next);
  };

  const handlePickerClose = async (open: boolean) => {
    setPickerOpen(open);
    if (!open && pendingTagIds !== null) {
      await setTagsForEntity(pendingTagIds, taggableId, taggableType);
      setPendingTagIds(null);
      onChanged?.();
    }
  };

  return (
    <YStack gap="$2" paddingHorizontal="$3" paddingVertical="$2">
      <XStack alignItems="center" gap="$2" flexWrap="wrap">
        {tags.map((tag) => (
          <FilterChip
            key={tag.id}
            label={tag.name}
            color={tag.color}
            onRemove={async () => {
              const next = tagIds.filter((id) => id !== tag.id);
              await setTagsForEntity(next, taggableId, taggableType);
              onChanged?.();
            }}
          />
        ))}
        <Button
          size="$2"
          variant="outlined"
          icon={<Plus size={14} pointerEvents="none" />}
          onPress={() => setPickerOpen(true)}
          borderStyle="dashed"
        >
          {tags.length === 0 ? t("tagsAdd") : undefined}
        </Button>
      </XStack>

      <TagPickerSheet
        open={pickerOpen}
        onOpenChange={handlePickerClose}
        taggableType={taggableType}
        selectedTagIds={activeTagIds}
        onToggleTag={handleToggleTag}
      />
    </YStack>
  );
};
