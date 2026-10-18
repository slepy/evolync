import { DashedButton, TextField } from "@/core/components";
import { TagsField } from "@/modules/tags";
import { Text, XStack, YStack } from "tamagui";
import { v4 as uuidv4 } from "uuid";
import { toggleDirection, type EditableRow, type NoteDraft } from "../noteRows";
import { NOTE_TITLE_MAX } from "../validation";
import { NoteRowCard } from "./NoteRowCard";

export const emptyRow = (): EditableRow => ({ id: uuidv4(), person1Text: "", person2Text: "", direction: "right" });

export interface NoteFormProps {
  value: NoteDraft;
  onChange: (next: NoteDraft) => void;
  autoFocusTitle?: boolean;
  /** Problem with the title from the last Create / Save, shown under the field. */
  titleError?: string;
}

/**
 * Body of the new-note and note screens (T3 / T4): TITLE, TAGS (rose chips,
 * dashed Add tag opening the tags sheet T5) and the Person 1 / Person 2 rows.
 */
export function NoteForm({ value, onChange, autoFocusTitle, titleError }: NoteFormProps) {
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
        maxLength={NOTE_TITLE_MAX}
        error={titleError}
        autoFocus={autoFocusTitle}
      />

      <TagsField tagIds={value.tagIds} onChange={(tagIds) => onChange({ ...value, tagIds })} />
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
    </>
  );
}
