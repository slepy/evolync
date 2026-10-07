import { database } from "@/database";
import TechniqueNoteDocument from "@/database/models/TechniqueNoteDocument";
import { Q } from "@nozbe/watermelondb";
import { v4 as uuidv4 } from "uuid";
import type { CreateNoteDocumentInput, UpdateNoteDocumentInput } from "../types";

export const NoteDocumentRepository = {
  async create(data: CreateNoteDocumentInput): Promise<TechniqueNoteDocument> {
    const collection = database.get<TechniqueNoteDocument>("technique_note_documents");
    return await database.write(async () => {
      return await collection.create((record) => {
        record._raw.id = uuidv4();
        record.userId = data.userId;
        record.title = data.title;
        if (data.description) record.description = data.description;
      });
    });
  },

  async findById(id: string): Promise<TechniqueNoteDocument | null> {
    const collection = database.get<TechniqueNoteDocument>("technique_note_documents");
    try {
      return await collection.find(id);
    } catch {
      return null;
    }
  },

  async findByUserId(userId: string): Promise<TechniqueNoteDocument[]> {
    const collection = database.get<TechniqueNoteDocument>("technique_note_documents");
    return await collection
      .query(Q.where("user_id", userId), Q.where("deleted_at", null))
      .fetch();
  },

  async update(id: string, data: UpdateNoteDocumentInput): Promise<TechniqueNoteDocument> {
    const collection = database.get<TechniqueNoteDocument>("technique_note_documents");
    const record = await collection.find(id);
    return await database.write(async () => {
      return await record.update((r) => {
        if (data.title !== undefined) r.title = data.title;
        if (data.description !== undefined) r.description = data.description;
      });
    });
  },

  async softDelete(id: string): Promise<void> {
    const collection = database.get<TechniqueNoteDocument>("technique_note_documents");
    const record = await collection.find(id);
    await database.write(async () => {
      await record.update((r) => {
        r.deletedAt = new Date();
      });
    });
  },

  observeById(id: string) {
    const collection = database.get<TechniqueNoteDocument>("technique_note_documents");
    return collection.findAndObserve(id);
  },

  observeByUserId(userId: string) {
    const collection = database.get<TechniqueNoteDocument>("technique_note_documents");
    return collection
      .query(
        Q.where("user_id", userId),
        Q.where("deleted_at", null),
        Q.sortBy("created_at", Q.desc)
      )
      .observeWithColumns(["title", "description"]);
  },
};
