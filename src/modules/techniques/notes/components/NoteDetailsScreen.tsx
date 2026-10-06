import { PrimaryButton, SubScreenPage, TrashButton } from "@/core/components";
import type TechniqueNoteRow from "@/database/models/TechniqueNoteRow";
import { LoadingScreen } from "@/modules/core/components";
import { confirmDelete } from "@/modules/core/utils/confirmDelete";
import { useEntityTags } from "@/modules/tags";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNoteDocument, useNoteRows } from "../hooks";
import { isNoteChanged, normalizeDraft, type EditableRow, type NoteDraft } from "../noteRows";
import { deleteNoteDocument, saveNote } from "../services";
import type { AttackDirection } from "../types";
import { NoteForm } from "./NoteForm";

const toEditable = (row: TechniqueNoteRow): EditableRow => ({
  id: row.id,
  person1Text: row.person1Text,
  person2Text: row.person2Text,
  direction: row.direction as AttackDirection,
});

/**
 * A note (T4): the same form as T3, trash in the header. Save in Notebook
 * cyan appears only once something differs from the saved note (T4A).
 */
export function NoteDetailsScreen({ documentId }: { documentId: string }) {
  const router = useRouter();
  const { document, isLoading: docLoading } = useNoteDocument(documentId);
  const { rows, isLoading: rowsLoading } = useNoteRows(documentId);
  const { tagIds, isLoading: tagsLoading } = useEntityTags(documentId, "note_document");
  const loading = docLoading || rowsLoading || tagsLoading;
  const title = document?.title;

  const saved = useMemo<NoteDraft | null>(
    () => (title !== undefined ? { title, tagIds, rows: rows.map(toEditable) } : null),
    [title, tagIds, rows],
  );
  const [draft, setDraft] = useState<NoteDraft | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  // What the last Save wrote: once the database shows it, the form takes the
  // stored rows (with their real ids) so the next Save updates, not duplicates.
  const pendingSave = useRef<NoteDraft | null>(null);

  useEffect(() => {
    if (loading || !saved) return;
    if (draft === null) {
      setDraft(saved);
    } else if (pendingSave.current && !isNoteChanged(saved, pendingSave.current)) {
      pendingSave.current = null;
      setDraft(saved);
    }
  }, [loading, saved, draft]);

  if (loading || (document && !draft)) return <LoadingScreen />;
  if (!document || !saved || !draft) return <SubScreenPage title={t("notesTitle")}>{null}</SubScreenPage>;

  const dirty = isNoteChanged(saved, draft);

  const handleSave = async () => {
    if (isSaving || !draft.title.trim()) return;
    setIsSaving(true);
    try {
      const stored = normalizeDraft(draft);
      pendingSave.current = stored;
      setDraft(stored);
      await saveNote(documentId, stored);
    } catch (err) {
      pendingSave.current = null;
      console.error("[NoteDetailsScreen] save:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () =>
    confirmDelete(t("notesDeleteDocument"), t("notesDeleteDocumentConfirm"), async () => {
      await deleteNoteDocument(documentId);
      router.back();
    });

  return (
    <SubScreenPage
      title={document.title}
      right={<TrashButton label={t("notesDeleteDocument")} onPress={handleDelete} />}
      footer={
        dirty || isSaving ? (
          <PrimaryButton label={t("save")} accent="notebook" onPress={handleSave} disabled={!draft.title.trim()} loading={isSaving} />
        ) : undefined
      }
    >
      <NoteForm value={draft} onChange={setDraft} />
    </SubScreenPage>
  );
}
