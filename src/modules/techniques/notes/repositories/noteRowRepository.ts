import { database } from "@/database";
import TechniqueNoteRow from "@/database/models/TechniqueNoteRow";
import { Q } from "@nozbe/watermelondb";
import { v4 as uuidv4 } from "uuid";
import type { CreateNoteRowInput, UpdateNoteRowInput } from "../types";

export const NoteRowRepository = {
  async create(data: CreateNoteRowInput): Promise<TechniqueNoteRow> {
    const collection = database.get<TechniqueNoteRow>("technique_note_rows");
    return await database.write(async () => {
      return await collection.create((record) => {
        record._raw.id = uuidv4();
        record.documentId = data.documentId;
        record.orderIndex = data.orderIndex;
        record.person1Text = data.person1Text ?? "";
        record.person2Text = data.person2Text ?? "";
        record.direction = data.direction ?? "right";
      });
    });
  },

  async findById(id: string): Promise<TechniqueNoteRow | null> {
    const collection = database.get<TechniqueNoteRow>("technique_note_rows");
    try {
      return await collection.find(id);
    } catch {
      return null;
    }
  },

  async findByDocumentId(documentId: string): Promise<TechniqueNoteRow[]> {
    const collection = database.get<TechniqueNoteRow>("technique_note_rows");
    return await collection
      .query(
        Q.where("document_id", documentId),
        Q.where("deleted_at", null),
        Q.sortBy("order_index", Q.asc)
      )
      .fetch();
  },

  async update(id: string, data: UpdateNoteRowInput): Promise<TechniqueNoteRow> {
    const collection = database.get<TechniqueNoteRow>("technique_note_rows");
    const record = await collection.find(id);
    return await database.write(async () => {
      return await record.update((r) => {
        if (data.person1Text !== undefined) r.person1Text = data.person1Text;
        if (data.person2Text !== undefined) r.person2Text = data.person2Text;
        if (data.direction !== undefined) r.direction = data.direction;
        if (data.orderIndex !== undefined) r.orderIndex = data.orderIndex;
      });
    });
  },

  async softDelete(id: string): Promise<void> {
    const collection = database.get<TechniqueNoteRow>("technique_note_rows");
    const record = await collection.find(id);
    await database.write(async () => {
      await record.update((r) => {
        r.deletedAt = new Date();
      });
    });
  },

  async countByDocumentId(documentId: string): Promise<number> {
    const collection = database.get<TechniqueNoteRow>("technique_note_rows");
    return await collection
      .query(Q.where("document_id", documentId), Q.where("deleted_at", null))
      .fetchCount();
  },

  observeByDocumentId(documentId: string) {
    const collection = database.get<TechniqueNoteRow>("technique_note_rows");
    return collection
      .query(
        Q.where("document_id", documentId),
        Q.where("deleted_at", null),
        Q.sortBy("order_index", Q.asc)
      )
      .observe();
  },
};
