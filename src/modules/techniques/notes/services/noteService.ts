import { sync } from "@/database/sync";
import type TechniqueNoteDocument from "@/database/models/TechniqueNoteDocument";
import { setTagsForEntity } from "@/modules/tags";
import { planRowChanges, type EditableRow } from "../noteRows";
import { NoteDocumentRepository } from "../repositories/noteDocumentRepository";
import { NoteRowRepository } from "../repositories/noteRowRepository";
import { createNoteDocumentSchema } from "../validation";

export interface NoteInput {
  title: string;
  tagIds: string[];
  rows: EditableRow[];
}

/** Trimmed, valid title; throws the translation key of the problem ("noteTitleRequired"…). */
const validTitle = (title: string): string => {
  const parsed = createNoteDocumentSchema.safeParse({ title });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "noteTitleRequired");
  return parsed.data.title;
};

const rowFields = (row: EditableRow, orderIndex: number) => ({
  orderIndex,
  person1Text: row.person1Text.trim(),
  person2Text: row.person2Text.trim(),
  direction: row.direction,
});

async function writeRows(documentId: string, rows: EditableRow[]): Promise<void> {
  const saved = await NoteRowRepository.findByDocumentId(documentId);
  const changes = planRowChanges(saved.map((row) => row.id), rows);
  for (const id of changes.remove) await NoteRowRepository.softDelete(id);
  for (const { row, orderIndex } of changes.update) await NoteRowRepository.update(row.id, rowFields(row, orderIndex));
  for (const { row, orderIndex } of changes.create) {
    await NoteRowRepository.create({ documentId, ...rowFields(row, orderIndex) });
  }
}

/** New note (T3): the document, its tags and its non-empty rows. */
export const createNote = async (userId: string, data: NoteInput): Promise<TechniqueNoteDocument> => {
  const title = validTitle(data.title);

  const document = await NoteDocumentRepository.create({ userId, title });
  await writeRows(document.id, data.rows);
  if (data.tagIds.length > 0) await setTagsForEntity(data.tagIds, document.id, "note_document");

  sync().catch(console.error);
  return document;
};

/** Save of an existing note (T4A): title, tag set and rows as shown on screen. */
export const saveNote = async (documentId: string, data: NoteInput): Promise<void> => {
  const title = validTitle(data.title);

  await NoteDocumentRepository.update(documentId, { title });
  await writeRows(documentId, data.rows);
  await setTagsForEntity(data.tagIds, documentId, "note_document");

  sync().catch(console.error);
};

export const deleteNoteDocument = async (id: string): Promise<void> => {
  const rows = await NoteRowRepository.findByDocumentId(id);
  for (const row of rows) {
    await NoteRowRepository.softDelete(row.id);
  }
  await NoteDocumentRepository.softDelete(id);
  sync().catch(console.error);
};
