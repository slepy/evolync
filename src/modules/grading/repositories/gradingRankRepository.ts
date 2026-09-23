import { database } from "@/database";
import GradingRank from "@/database/models/GradingRank";
import { Q } from "@nozbe/watermelondb";
import { v4 as uuidv4 } from "uuid";

export const GradingRankRepository = {
  async create(data: {
    organizationId: string;
    name: string;
    order: number;
    color?: string;
  }): Promise<GradingRank> {
    const collection = database.get<GradingRank>("organization_gradings");
    return await database.write(async () => {
      return await collection.create((record) => {
        record._raw.id = uuidv4();
        record.organizationId = data.organizationId;
        record.name = data.name;
        record.order = data.order;
        if (data.color) record.color = data.color;
      });
    });
  },

  async findByOrganizationId(organizationId: string): Promise<GradingRank[]> {
    const collection = database.get<GradingRank>("organization_gradings");
    return await collection
      .query(
        Q.where("organization_id", organizationId),
        Q.where("deleted_at", null),
        Q.sortBy("order", Q.asc),
      )
      .fetch();
  },

  async findById(id: string): Promise<GradingRank | null> {
    const collection = database.get<GradingRank>("organization_gradings");
    try {
      const rank = await collection.find(id);
      if (rank.deletedAt) return null;
      return rank;
    } catch {
      return null;
    }
  },

  async update(id: string, data: { name?: string; color?: string }): Promise<GradingRank> {
    const collection = database.get<GradingRank>("organization_gradings");
    const rank = await collection.find(id);
    return await database.write(async () => {
      return await rank.update((record) => {
        if (data.name !== undefined) record.name = data.name;
        if (data.color !== undefined) record.color = data.color;
      });
    });
  },

  async softDelete(id: string): Promise<void> {
    const collection = database.get<GradingRank>("organization_gradings");
    const rank = await collection.find(id);
    await database.write(async () => {
      await rank.update((record) => {
        record.deletedAt = new Date();
      });
    });
  },

  observeByOrganizationId(organizationId: string) {
    const collection = database.get<GradingRank>("organization_gradings");
    return collection
      .query(
        Q.where("organization_id", organizationId),
        Q.where("deleted_at", null),
        Q.sortBy("order", Q.asc),
      )
      .observeWithColumns(["name", "color", "order"]);
  },
};
