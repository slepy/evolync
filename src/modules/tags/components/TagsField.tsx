import { DashedButton, TagChip } from "@/core/components";
import { useState } from "react";
import { Text, XStack, YStack } from "tamagui";
import { useTags } from "../hooks";
import { TagPickerSheet } from "./TagPickerSheet";

export interface TagsFieldProps {
  tagIds: string[];
  onChange: (tagIds: string[]) => void;
}

/**
 * TAGS field of a form (T3 / T4 notes, D5 new 3D sequence): rose chips with ×
 * and a dashed Add tag opening the tags sheet (T5).
 */
export function TagsField({ tagIds, onChange }: TagsFieldProps) {
  const { tags } = useTags();
  const [open, setOpen] = useState(false);
  const selected = tags.filter((tag) => tagIds.includes(tag.id));

  const toggle = (tagId: string) =>
    onChange(tagIds.includes(tagId) ? tagIds.filter((id) => id !== tagId) : [...tagIds, tagId]);

  return (
    <>
      <YStack gap={8}>
        <Text fontSize={12} fontWeight="$eyebrow" letterSpacing={0.8} textTransform="uppercase" color="$neutralMuted">
          {t("tagsPicker")}
        </Text>
        <XStack flexWrap="wrap" gap={8}>
          {selected.map((tag) => (
            <TagChip key={tag.id} size="md" label={tag.name} onRemove={() => toggle(tag.id)} />
          ))}
          <DashedButton size="chip" accent="tags" label={t("tagsAdd")} onPress={() => setOpen(true)} />
        </XStack>
      </YStack>
      <TagPickerSheet open={open} onOpenChange={setOpen} selectedTagIds={tagIds} onToggleTag={toggle} />
    </>
  );
}
