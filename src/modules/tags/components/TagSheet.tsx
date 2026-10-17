import { FormSheet, PrimaryButton, TextField, TrashButton } from "@/core/components";
import { moduleAccents } from "@/core/theme/tokens";
import type Tag from "@/database/models/Tag";
import { confirmDelete } from "@/modules/core/utils/confirmDelete";
import { useStore } from "@/store";
import React, { useEffect, useState } from "react";
import { createTag, deleteTag, updateTag } from "../services";
import { TAG_NAME_MAX } from "../validation/tagSchema";

interface TagSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Tag to edit (7C); without it the sheet creates a new tag (7B). */
  tag?: Tag | null;
  /** Called with the new tag after Create (the note's tags sheet selects it). */
  onCreated?: (tag: Tag) => void;
}

/** Bottom sheet that adds a tag (Create) or renames / deletes one (Save, trash). */
export const TagSheet: React.FC<TagSheetProps> = ({ open, onOpenChange, tag, onCreated }) => {
  const user = useStore((s) => s.user);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const editing = !!tag;

  useEffect(() => {
    if (open) {
      setName(tag?.name ?? "");
      setError(undefined);
    }
  }, [open, tag]);

  const trimmed = name.trim();
  const canSubmit = trimmed.length > 0 && (!editing || trimmed !== tag.name);

  const handleSubmit = async () => {
    if (!canSubmit || isSaving || (!tag && !user)) return;
    setIsSaving(true);
    try {
      if (tag) {
        await updateTag(tag.id, { name: trimmed });
      } else if (user) {
        const created = await createTag({ userId: user.id, name: trimmed, color: moduleAccents.tags.tint });
        onCreated?.(created);
      }
      onOpenChange(false);
    } catch (err) {
      console.error("[TagSheet] save:", err);
      setError(t(err instanceof Error ? err.message : "errorUnknown"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!tag) return;
    confirmDelete(t("tagsDeleteConfirm"), "", async () => {
      await deleteTag(tag.id);
      onOpenChange(false);
    });
  };

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? t("tagsEdit") : t("tagsCreateNew")}
      headerAction={editing ? <TrashButton onPress={handleDelete} disabled={isSaving} /> : undefined}
      footer={
        <PrimaryButton
          label={editing ? t("save") : t("create")}
          accent="tags"
          onPress={handleSubmit}
          disabled={!canSubmit}
          loading={isSaving}
        />
      }
    >
      <TextField
        label={t("fieldName")}
        value={name}
        onChangeText={(value) => {
          setName(value);
          setError(undefined);
        }}
        placeholder={t("tagsNewTagName")}
        accent="tags"
        maxLength={TAG_NAME_MAX}
        error={error}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
      />
    </FormSheet>
  );
};
