import { PrimaryButton, SubScreenPage } from "@/core/components";
import { useStore } from "@/store";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import type { NoteDraft } from "../noteRows";
import { createNote } from "../services";
import { emptyRow, NoteForm } from "./NoteForm";

/** New note (T3): title, tags, one empty row, Create in Notebook cyan. */
export function NoteCreateScreen() {
  const router = useRouter();
  const userId = useStore((s) => s.user?.id);
  const [draft, setDraft] = useState<NoteDraft>(() => ({ title: "", tagIds: [], rows: [emptyRow()] }));
  const [isSaving, setIsSaving] = useState(false);

  const handleCreate = async () => {
    if (!userId || isSaving || !draft.title.trim()) return;
    setIsSaving(true);
    try {
      const note = await createNote(userId, draft);
      router.replace(`/techniques/notes/${note.id}` as any);
    } catch (err) {
      console.error("[NoteCreateScreen] create:", err);
      setIsSaving(false);
    }
  };

  return (
    <SubScreenPage
      title={t("notesNewDocument")}
      right={false}
      footer={
        <PrimaryButton
          label={t("create")}
          accent="notebook"
          onPress={handleCreate}
          disabled={!draft.title.trim()}
          loading={isSaving}
        />
      }
    >
      <NoteForm value={draft} onChange={setDraft} autoFocusTitle />
    </SubScreenPage>
  );
}
