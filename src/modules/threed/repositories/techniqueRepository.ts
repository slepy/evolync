import { database } from "@/database";
import Technique from "@/database/models/Technique";
import { Q } from "@nozbe/watermelondb";
import { v4 as uuidv4 } from "uuid";

export const TechniqueRepository = {
  async create(data: Partial<Technique>): Promise<Technique> {
    const collection = database.get<Technique>("techniques");
    return await database.write(async () => {
      return await collection.create((record) => {
        record._raw.id = uuidv4();
        Object.assign(record, data);
      });
    });
  },

  async findById(id: string): Promise<Technique | null> {
    const collection = database.get<Technique>("techniques");
    try {
      const record = await collection.find(id);
      if (record.deletedAt) return null;
      return record;
    } catch {
      return null;
    }
  },

  async findByUserId(userId: string): Promise<Technique[]> {
    const collection = database.get<Technique>("techniques");
    return await collection
      .query(
        Q.where("user_id", userId),
        Q.where("deleted_at", null),
        Q.sortBy("created_at", Q.desc)
      )
      .fetch();
  },

  async findByUserIdAndBodyPart(
    userId: string,
    bodyPart: string
  ): Promise<Technique[]> {
    const collection = database.get<Technique>("techniques");
    return await collection
      .query(
        Q.where("user_id", userId),
        Q.where("body_part", bodyPart),
        Q.where("deleted_at", null),
        Q.sortBy("created_at", Q.desc)
      )
      .fetch();
  },

  async update(id: string, data: Partial<Technique>): Promise<Technique> {
    const collection = database.get<Technique>("techniques");
    const record = await collection.find(id);
    return await database.write(async () => {
      return await record.update((r) => {
        Object.assign(r, data);
      });
    });
  },

  async softDelete(id: string): Promise<void> {
    const collection = database.get<Technique>("techniques");
    const record = await collection.find(id);
    await database.write(async () => {
      await record.update((r) => {
        r.deletedAt = new Date();
      });
    });
  },

  observeByUserId(userId: string) {
    const collection = database.get<Technique>("techniques");
    return collection
      .query(
        Q.where("user_id", userId),
        Q.where("deleted_at", null),
        Q.sortBy("created_at", Q.desc)
      )
      .observe();
  },

  observeByUserIdAndBodyPart(userId: string, bodyPart: string) {
    const collection = database.get<Technique>("techniques");
    return collection
      .query(
        Q.where("user_id", userId),
        Q.where("body_part", bodyPart),
        Q.where("deleted_at", null),
        Q.sortBy("created_at", Q.desc)
      )
      .observe();
  },

  observeStartingPositionsByUserId(userId: string) {
    const collection = database.get<Technique>("techniques");
    return collection
      .query(
        Q.where("user_id", userId),
        Q.where("body_part", "fullbody"),
        Q.where("deleted_at", null),
        Q.sortBy("created_at", Q.desc)
      )
      .observe();
  },

  observeTechniquesByUserIdExcludingFullbody(userId: string) {
    const collection = database.get<Technique>("techniques");
    return collection
      .query(
        Q.where("user_id", userId),
        Q.where("body_part", Q.notEq("fullbody")),
        Q.where("deleted_at", null),
        Q.sortBy("created_at", Q.desc)
      )
      .observe();
  },
};
