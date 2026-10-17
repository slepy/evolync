import { AlertBanner, PrimaryButton, SubScreenPage } from "@/core/components";
import { useStore } from "@/store";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import type { NoteDraft } from "../noteRows";
import { createNote } from "../services";
import { NOTE_TITLE_ERRORS } from "../validation";
import { emptyRow, NoteForm } from "./NoteForm";

/** New note (T3): title, tags, one empty row, Create in Notebook cyan. */
export function NoteCreateScreen() {
  const router = useRouter();
  const userId = useStore((s) => s.user?.id);
  const [draft, setDraft] = useState<NoteDraft>(() => ({ title: "", tagIds: [], rows: [emptyRow()] }));
  const [isSaving, setIsSaving] = useState(false);
  const [titleError, setTitleError] = useState<string | undefined>();
  const [saveError, setSaveError] = useState(false);

  const change = (next: NoteDraft) => {
    if (next.title !== draft.title) setTitleError(undefined);
    setDraft(next);
  };

  const handleCreate = async () => {
    if (!userId || isSaving || !draft.title.trim()) return;
    setIsSaving(true);
    setSaveError(false);
    try {
      const note = await createNote(userId, draft);
      router.replace(`/techniques/notes/${note.id}` as any);
    } catch (err) {
      const key = err instanceof Error ? err.message : "";
      if (NOTE_TITLE_ERRORS.includes(key)) setTitleError(t(key));
      else {
        console.error("[NoteCreateScreen] create:", err);
        setSaveError(true);
      }
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
      {saveError ? <AlertBanner title={t("errorCreateFailed")} onDismiss={() => setSaveError(false)} /> : null}
      <NoteForm value={draft} onChange={change} autoFocusTitle titleError={titleError} />
    </SubScreenPage>
  );
}
