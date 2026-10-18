import { database } from "@/database";
import Sequence from "@/database/models/Sequence";
import { Q } from "@nozbe/watermelondb";
import { v4 as uuidv4 } from "uuid";

export const SequenceRepository = {
  async create(data: Partial<Sequence>): Promise<Sequence> {
    const collection = database.get<Sequence>("sequences");
    return await database.write(async () => {
      return await collection.create((record) => {
        record._raw.id = uuidv4();
        Object.assign(record, data);
      });
    });
  },

  async findById(id: string): Promise<Sequence | null> {
    const collection = database.get<Sequence>("sequences");
    try {
      const record = await collection.find(id);
      if (record.deletedAt) return null;
      return record;
    } catch {
      return null;
    }
  },

  async findByUserId(userId: string): Promise<Sequence[]> {
    const collection = database.get<Sequence>("sequences");
    return await collection
      .query(
        Q.where("user_id", userId),
        Q.where("deleted_at", null),
        Q.sortBy("created_at", Q.desc)
      )
      .fetch();
  },

  async update(id: string, data: Partial<Sequence>): Promise<Sequence> {
    const collection = database.get<Sequence>("sequences");
    const record = await collection.find(id);
    return await database.write(async () => {
      return await record.update((r) => {
        Object.assign(r, data);
      });
    });
  },

  async softDelete(id: string): Promise<void> {
    const collection = database.get<Sequence>("sequences");
    const record = await collection.find(id);
    await database.write(async () => {
      await record.update((r) => {
        r.deletedAt = new Date();
      });
    });
  },

  observeById(id: string) {
    return database.get<Sequence>("sequences").findAndObserve(id);
  },

  observeByUserId(userId: string) {
    const collection = database.get<Sequence>("sequences");
    return collection
      .query(
        Q.where("user_id", userId),
        Q.where("deleted_at", null),
        Q.sortBy("created_at", Q.desc)
      )
      .observe();
  },
};
