import { database } from "@/database";
import SchoolSettings from "@/database/models/SchoolSettings";
import { Q } from "@nozbe/watermelondb";
import { v4 as uuidv4 } from "uuid";

export const SchoolSettingsRepository = {
  async create(data: Partial<SchoolSettings>): Promise<SchoolSettings> {
    const collection = database.get<SchoolSettings>("school_settings");
    return await database.write(async () => {
      return await collection.create((record) => {
        record._raw.id = uuidv4();
        Object.assign(record, data);
      });
    });
  },

  async findBySchoolId(schoolId: string): Promise<SchoolSettings | null> {
    const collection = database.get<SchoolSettings>("school_settings");
    const results = await collection
      .query(
        Q.where("school_id", schoolId),
        Q.where("deleted_at", null)
      )
      .fetch();
    return results[0] || null;
  },

  async update(
    id: string,
    data: Partial<SchoolSettings>
  ): Promise<SchoolSettings> {
    const collection = database.get<SchoolSettings>("school_settings");
    const existing = await collection.find(id);
    return await database.write(async () => {
      return await existing.update((record) => {
        Object.assign(record, data);
      });
    });
  },

  async upsert(
    schoolId: string,
    data: Partial<SchoolSettings>
  ): Promise<SchoolSettings> {
    const existing = await this.findBySchoolId(schoolId);
    if (existing) {
      return await this.update(existing.id, data);
    } else {
      return await this.create({ ...data, schoolId });
    }
  },

  // Observable methods for reactive UI
  observeBySchoolId(schoolId: string) {
    const collection = database.get<SchoolSettings>("school_settings");
    return collection
      .query(
        Q.where("school_id", schoolId),
        Q.where("deleted_at", null)
      )
      .observe();
  },
};
