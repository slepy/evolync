import { ActionPill, FormSheet, ListCard, ListCheckbox, ListChip, ListIcon, ListRow, resolveListAccent } from "@/core/components";
import type Tag from "@/database/models/Tag";
import { Plus, Tag as TagIcon } from "lucide-react-native";
import React, { useState } from "react";
import { ScrollView } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { useTags } from "../hooks";
import { TagSheet } from "./TagSheet";

const rose = resolveListAccent("tags");

interface TagPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTagIds: string[];
  onToggleTag: (tagId: string) => void;
}

/**
 * Tags sheet (T5): "N selected" chip, one checkbox row per tag in Tags rose,
 * Add new under the list. Add new opens the tag create sheet (7B) and selects
 * the tag it creates.
 */
export const TagPickerSheet: React.FC<TagPickerSheetProps> = ({ open, onOpenChange, selectedTagIds, onToggleTag }) => {
  const { tags } = useTags();
  const [createOpen, setCreateOpen] = useState(false);
  const count = selectedTagIds.length;

  const openCreate = () => {
    onOpenChange(false);
    setCreateOpen(true);
  };

  const handleCreated = (tag: Tag) => {
    if (!selectedTagIds.includes(tag.id)) onToggleTag(tag.id);
  };

  return (
    <>
      <FormSheet
        open={open}
        onOpenChange={onOpenChange}
        title={t("tagsPicker")}
        badge={count > 0 ? <ListChip label={t("selectedCount", { count })} accent="tags" /> : undefined}
        footer={
          <XStack>
            <ActionPill label={t("addNew")} icon={Plus} tint={rose.label} fill={rose.fill} onPress={openCreate} />
          </XStack>
        }
      >
        {tags.length > 0 ? (
          <ScrollView style={{ maxHeight: 420 }} keyboardShouldPersistTaps="handled">
            <ListCard aria-label={t("tagsPicker")}>
              {tags.map((tag) => {
                const checked = selectedTagIds.includes(tag.id);
                return (
                  <ListRow
                    key={tag.id}
                    size="md"
                    title={tag.name}
                    role="checkbox"
                    aria-checked={checked}
                    leading={<ListIcon icon={TagIcon} accent="tags" size={36} />}
                    trailing={<ListCheckbox checked={checked} accent="tags" />}
                    onPress={() => onToggleTag(tag.id)}
                  />
                );
              })}
            </ListCard>
          </ScrollView>
        ) : (
          <YStack padding={20} borderRadius="$card" borderWidth={1} borderColor="$neutralCardBorder" backgroundColor="$neutralCard">
            <Text fontSize="$secondary" fontWeight="$secondary" color="$neutralMuted" textAlign="center">
              {t("tagsEmpty")}
            </Text>
          </YStack>
        )}
      </FormSheet>

      <TagSheet open={createOpen} onOpenChange={setCreateOpen} onCreated={handleCreated} />
    </>
  );
};
