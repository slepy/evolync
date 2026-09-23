import { database } from "@/database";
import Taggable from "@/database/models/Taggable";
import { Q } from "@nozbe/watermelondb";
import { v4 as uuidv4 } from "uuid";
import type { AttachTagInput, TaggableType } from "../types";

export const TaggableRepository = {
  async attach(data: AttachTagInput): Promise<Taggable> {
    const collection = database.get<Taggable>("taggables");
    return await database.write(async () => {
      return await collection.create((record) => {
        record._raw.id = uuidv4();
        record.tagId = data.tagId;
        record.taggableId = data.taggableId;
        record.taggableType = data.taggableType;
      });
    });
  },

  async detach(tagId: string, taggableId: string): Promise<void> {
    const collection = database.get<Taggable>("taggables");
    const records = await collection
      .query(
        Q.where("tag_id", tagId),
        Q.where("taggable_id", taggableId),
      )
      .fetch();
    if (records.length === 0) return;
    await database.write(async () => {
      await database.batch(records.map((r) => r.prepareMarkAsDeleted()));
    });
  },

  async detachAllFromEntity(taggableId: string, taggableType: TaggableType): Promise<void> {
    const collection = database.get<Taggable>("taggables");
    const records = await collection
      .query(
        Q.where("taggable_id", taggableId),
        Q.where("taggable_type", taggableType),
      )
      .fetch();
    if (records.length === 0) return;
    await database.write(async () => {
      await database.batch(records.map((r) => r.prepareMarkAsDeleted()));
    });
  },

  observeTagIdsForEntity(taggableId: string, taggableType: TaggableType) {
    const collection = database.get<Taggable>("taggables");
    return collection
      .query(
        Q.where("taggable_id", taggableId),
        Q.where("taggable_type", taggableType),
      )
      .observeWithColumns(["tag_id"]);
  },

  async fetchTagIdsForEntity(taggableId: string, taggableType: TaggableType): Promise<string[]> {
    const collection = database.get<Taggable>("taggables");
    const records = await collection
      .query(
        Q.where("taggable_id", taggableId),
        Q.where("taggable_type", taggableType),
      )
      .fetch();
    return records.map((r) => r.tagId);
  },

  async fetchEntityIdsByTag(tagId: string, taggableType: TaggableType): Promise<string[]> {
    const collection = database.get<Taggable>("taggables");
    const records = await collection
      .query(
        Q.where("tag_id", tagId),
        Q.where("taggable_type", taggableType),
      )
      .fetch();
    return records.map((r) => r.taggableId);
  },
};
