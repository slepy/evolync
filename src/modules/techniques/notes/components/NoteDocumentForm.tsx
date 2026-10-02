import {
  FilterChip,
  SubmitButton,
  SubmitComponent,
} from "@/modules/core/components";
import { useDirtyFlag } from "@/modules/core/hooks";
import { TagPickerSheet, useTags } from "@/modules/tags";
import { useEntityTags } from "@/modules/tags/hooks";
import { setTagsForEntity } from "@/modules/tags/services";
import type { AttackDirection } from "@/modules/techniques/notes/types";
import { confirmDelete } from "@/modules/core/utils/confirmDelete";
import { Plus } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { FlatList } from "react-native";
import { Button, Input, Text, XStack, YStack } from "tamagui";
import { v4 as uuidv4 } from "uuid";
import { NoteRowItem } from "./NoteRowItem";
import { NoteTableHeader } from "./NoteTableHeader";
import type { LocalRow } from "./NoteRowItem";

export interface NoteDocumentFormProps {
  /** When provided, the form operates in edit mode and loads existing data */
  documentId?: string;
  initialTitle?: string;
  initialRows?: LocalRow[];
  onSave: (data: {
    title: string;
    tagIds: string[];
    rows: LocalRow[];
    deletedRowIds: string[];
    newRowIds: Set<string>;
  }) => Promise<void>;
  isSaving?: boolean;
  saveLabel?: string;
}

export function NoteDocumentForm({
  documentId,
  initialTitle = "",
  initialRows,
  onSave,
  isSaving = false,
  saveLabel,
}: NoteDocumentFormProps) {
  const { tags: allTags } = useTags();
  const { tagIds: savedTagIds } = useEntityTags(
    documentId ?? "",
    "note_document",
  );

  const [title, setTitle] = useState(initialTitle);
  const [localRows, setLocalRows] = useState<LocalRow[]>(
    initialRows ?? [
      { id: uuidv4(), person1Text: "", person2Text: "", direction: "right" },
    ],
  );
  const [pendingTagIds, setPendingTagIds] = useState<string[] | null>(null);
  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const deletedRowIds = useRef<string[]>([]);
  const newRowIds = useRef<Set<string>>(new Set());
  const { isDirty, markDirty, reset: resetDirty } = useDirtyFlag();

  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);

  useEffect(() => {
    if (initialRows) {
      setLocalRows(initialRows);
    }
  }, [initialRows]);

  const activeTagIds = pendingTagIds ?? savedTagIds;
  const activeTags = allTags.filter((tag) => activeTagIds.includes(tag.id));

  const handleSubmit = async () => {
    if (!title.trim() || isSaving) return;
    await onSave({
      title: title.trim(),
      tagIds: activeTagIds,
      rows: localRows,
      deletedRowIds: deletedRowIds.current,
      newRowIds: newRowIds.current,
    });
    deletedRowIds.current = [];
    newRowIds.current = new Set();
    resetDirty();
    setPendingTagIds(null);
  };

  const handleToggleTag = (tagId: string) => {
    const next = activeTagIds.includes(tagId)
      ? activeTagIds.filter((id) => id !== tagId)
      : [...activeTagIds, tagId];
    setPendingTagIds(next);
    markDirty();
  };

  const handleDirectionToggle = (id: string, current: AttackDirection) => {
    const next: AttackDirection = current === "right" ? "left" : "right";
    markDirty();
    setLocalRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, direction: next } : r)),
    );
  };

  const handleDeleteRow = (id: string) => {
    confirmDelete(t("notesDeleteRow"), "", () => {
      markDirty();
      setLocalRows((prev) => prev.filter((r) => r.id !== id));
      if (newRowIds.current.has(id)) {
        newRowIds.current.delete(id);
      } else {
        deletedRowIds.current = [...deletedRowIds.current, id];
      }
    });
  };

  const handleChangeText = (
    id: string,
    field: "person1Text" | "person2Text",
    value: string,
  ) => {
    markDirty();
    setLocalRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
  };

  const handleAddRow = () => {
    const tempId = uuidv4();
    newRowIds.current.add(tempId);
    markDirty();
    setLocalRows((prev) => [
      ...prev,
      { id: tempId, person1Text: "", person2Text: "", direction: "right" },
    ]);
  };

  return (
    <>
      <YStack
        padding="$3"
        gap="$2"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <Input
          size="$4"
          fontWeight="600"
          placeholder={t("notesDocumentTitlePlaceholder")}
          value={title}
          onChangeText={(v) => {
            markDirty();
            setTitle(v);
          }}
          autoFocus={!documentId}
        />
        <XStack alignItems="center" gap="$2" flexWrap="wrap">
          {activeTags.map((tag) => (
            <FilterChip
              key={tag.id}
              label={tag.name}
              color={tag.color}
              onRemove={() => handleToggleTag(tag.id)}
            />
          ))}
          <Button
            size="$2"
            variant="outlined"
            icon={<Plus size={14} pointerEvents="none" />}
            onPress={() => setTagPickerOpen(true)}
            borderStyle="dashed"
          >
            {activeTags.length === 0 ? t("tagsAdd") : undefined}
          </Button>
        </XStack>
      </YStack>

      <TagPickerSheet
        open={tagPickerOpen}
        onOpenChange={setTagPickerOpen}
        taggableType="note_document"
        selectedTagIds={activeTagIds}
        onToggleTag={handleToggleTag}
      />

      <NoteTableHeader />

      <FlatList
        data={localRows}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NoteRowItem
            row={item}
            onDirectionToggle={handleDirectionToggle}
            onDeleteRow={handleDeleteRow}
            onChangeText={handleChangeText}
          />
        )}
        ListEmptyComponent={
          <YStack
            alignItems="center"
            paddingVertical="$8"
            paddingHorizontal="$6"
          >
            <Text fontSize="$3" color="$textSecondary" textAlign="center">
              {t("notesNoRows")}
            </Text>
          </YStack>
        }
      />

      <SubmitComponent
        onPress={handleSubmit}
        isLoading={isSaving}
        disabled={!title.trim() || isSaving}
      >
        <Button
          size="$4"
          variant="outlined"
          onPress={handleAddRow}
          icon={<Plus size={18} pointerEvents="none" />}
        >
          {t("notesAddRow")}
        </Button>
        {isDirty && (
          <SubmitButton
            onPress={handleSubmit}
            isLoading={isSaving}
            disabled={!title.trim() || isSaving}
            title={saveLabel ?? t("save")}
          />
        )}
      </SubmitComponent>
    </>
  );
}
