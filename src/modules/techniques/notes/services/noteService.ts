import { sync } from "@/database/sync";
import { NoteDocumentRepository } from "../repositories/noteDocumentRepository";
import { NoteRowRepository } from "../repositories/noteRowRepository";
import type {
  AttackDirection,
  CreateNoteDocumentInput,
  UpdateNoteDocumentInput,
  UpdateNoteRowInput,
} from "../types";
import type TechniqueNoteDocument from "@/database/models/TechniqueNoteDocument";
import type TechniqueNoteRow from "@/database/models/TechniqueNoteRow";

export const createNoteDocument = async (
  data: CreateNoteDocumentInput
): Promise<TechniqueNoteDocument> => {
  if (!data.title.trim()) throw new Error("noteTitleRequired");

  const document = await NoteDocumentRepository.create(data);

  await NoteRowRepository.create({
    documentId: document.id,
    orderIndex: 0,
    person1Text: "",
    person2Text: "",
    direction: "right",
  });

  sync().catch(console.error);
  return document;
};

export const updateNoteDocument = async (
  id: string,
  data: UpdateNoteDocumentInput
): Promise<TechniqueNoteDocument> => {
  const updated = await NoteDocumentRepository.update(id, data);
  sync().catch(console.error);
  return updated;
};

export const deleteNoteDocument = async (id: string): Promise<void> => {
  const rows = await NoteRowRepository.findByDocumentId(id);
  for (const row of rows) {
    await NoteRowRepository.softDelete(row.id);
  }
  await NoteDocumentRepository.softDelete(id);
  sync().catch(console.error);
};

export const addNoteRow = async (
  documentId: string,
  data?: { person1Text?: string; person2Text?: string; direction?: AttackDirection },
): Promise<TechniqueNoteRow> => {
  const count = await NoteRowRepository.countByDocumentId(documentId);
  const row = await NoteRowRepository.create({
    documentId,
    orderIndex: count,
    person1Text: data?.person1Text ?? "",
    person2Text: data?.person2Text ?? "",
    direction: data?.direction ?? "right",
  });
  sync().catch(console.error);
  return row;
};

export const updateNoteRow = async (
  id: string,
  data: UpdateNoteRowInput,
): Promise<TechniqueNoteRow> => {
  const updated = await NoteRowRepository.update(id, data);
  return updated;
};

export const deleteNoteRow = async (id: string): Promise<void> => {
  await NoteRowRepository.softDelete(id);
  sync().catch(console.error);
};
