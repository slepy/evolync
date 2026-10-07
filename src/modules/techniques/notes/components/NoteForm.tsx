import { DashedButton, TagChip, TextField } from "@/core/components";
import { TagPickerSheet, useTags } from "@/modules/tags";
import { useState } from "react";
import { Text, XStack, YStack } from "tamagui";
import { v4 as uuidv4 } from "uuid";
import { toggleDirection, type EditableRow, type NoteDraft } from "../noteRows";
import { NoteRowCard } from "./NoteRowCard";

export const emptyRow = (): EditableRow => ({ id: uuidv4(), person1Text: "", person2Text: "", direction: "right" });

export interface NoteFormProps {
  value: NoteDraft;
  onChange: (next: NoteDraft) => void;
  autoFocusTitle?: boolean;
}

/**
 * Body of the new-note and note screens (T3 / T4): TITLE, TAGS (rose chips,
 * dashed Add tag opening the tags sheet T5) and the Person 1 / Person 2 rows.
 */
export function NoteForm({ value, onChange, autoFocusTitle }: NoteFormProps) {
  const { tags } = useTags();
  const [tagsOpen, setTagsOpen] = useState(false);
  const selectedTags = tags.filter((tag) => value.tagIds.includes(tag.id));

  const toggleTag = (tagId: string) =>
    onChange({
      ...value,
      tagIds: value.tagIds.includes(tagId) ? value.tagIds.filter((id) => id !== tagId) : [...value.tagIds, tagId],
    });

  const updateRow = (id: string, patch: Partial<EditableRow>) =>
    onChange({ ...value, rows: value.rows.map((row) => (row.id === id ? { ...row, ...patch } : row)) });

  return (
    <>
      <YStack gap={18}>
      <TextField
        label={t("notesDocumentTitle")}
        value={value.title}
        onChangeText={(title) => onChange({ ...value, title })}
        placeholder={t("notesDocumentTitlePlaceholder")}
        accent="notebook"
        maxLength={200}
        autoFocus={autoFocusTitle}
      />

      <YStack gap={8}>
        <Text fontSize={12} fontWeight="$eyebrow" letterSpacing={0.8} textTransform="uppercase" color="$neutralMuted">
          {t("tagsPicker")}
        </Text>
        <XStack flexWrap="wrap" gap={8}>
          {selectedTags.map((tag) => (
            <TagChip key={tag.id} size="md" label={tag.name} onRemove={() => toggleTag(tag.id)} />
          ))}
          <DashedButton size="chip" accent="tags" label={t("tagsAdd")} onPress={() => setTagsOpen(true)} />
        </XStack>
      </YStack>
      </YStack>

      <YStack gap={14} marginTop={4}>
        <XStack alignItems="baseline" justifyContent="space-between" gap={12}>
          <Text fontSize={18} fontWeight="$section" color="$neutralText">
            {t("notesRows")}
          </Text>
          <Text flexShrink={1} fontSize={13} fontWeight="600" color="$neutralMuted" textAlign="right">
            {t("notesRowsHint")}
          </Text>
        </XStack>
        {value.rows.length > 0 && (
          <YStack gap={26}>
            {value.rows.map((row, index) => (
              <NoteRowCard
                key={row.id}
                row={row}
                number={index + 1}
                onChangeText={(field, text) => updateRow(row.id, { [field]: text })}
                onToggleDirection={() => updateRow(row.id, { direction: toggleDirection(row.direction) })}
                onDelete={() => onChange({ ...value, rows: value.rows.filter((r) => r.id !== row.id) })}
              />
            ))}
          </YStack>
        )}
        <DashedButton
          accent="notebook"
          label={t("notesAddRow")}
          onPress={() => onChange({ ...value, rows: [...value.rows, emptyRow()] })}
        />
      </YStack>

      <TagPickerSheet open={tagsOpen} onOpenChange={setTagsOpen} selectedTagIds={value.tagIds} onToggleTag={toggleTag} />
    </>
  );
}
