import { database } from "@/database";
import Tag from "@/database/models/Tag";
import { Q } from "@nozbe/watermelondb";
import { v4 as uuidv4 } from "uuid";
import type { CreateTagInput, UpdateTagInput } from "../types";

export const TagRepository = {
  async create(data: CreateTagInput): Promise<Tag> {
    const collection = database.get<Tag>("tags");
    return await database.write(async () => {
      return await collection.create((record) => {
        record._raw.id = uuidv4();
        record.userId = data.userId;
        record.name = data.name;
        record.color = data.color;
      });
    });
  },

  async findById(id: string): Promise<Tag | null> {
    const collection = database.get<Tag>("tags");
    try {
      return await collection.find(id);
    } catch {
      return null;
    }
  },

  async update(id: string, data: UpdateTagInput): Promise<Tag> {
    const collection = database.get<Tag>("tags");
    const record = await collection.find(id);
    return await database.write(async () => {
      return await record.update((r) => {
        if (data.name !== undefined) r.name = data.name;
        if (data.color !== undefined) r.color = data.color;
      });
    });
  },

  async softDelete(id: string): Promise<void> {
    const collection = database.get<Tag>("tags");
    const record = await collection.find(id);
    await database.write(async () => {
      await record.update((r) => {
        r.deletedAt = new Date();
      });
    });
  },

  observeByUserId(userId: string) {
    const collection = database.get<Tag>("tags");
    return collection
      .query(
        Q.where("user_id", userId),
        Q.where("deleted_at", null),
        Q.sortBy("created_at", Q.asc),
      )
      .observeWithColumns(["name", "color"]);
  },
};
