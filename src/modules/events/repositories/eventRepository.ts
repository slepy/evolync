import { database } from "@/database";
import Event from "@/database/models/Event";
import { Q } from "@nozbe/watermelondb";
import { v4 as uuidv4 } from "uuid";

export const EventRepository = {
  async create(data: Partial<Event>): Promise<Event> {
    const collection = database.get<Event>("events");
    return await database.write(async () => {
      return await collection.create((record) => {
        record._raw.id = uuidv4();
        Object.assign(record, data);
      });
    });
  },

  async findById(id: string): Promise<Event | null> {
    const collection = database.get<Event>("events");
    try {
      const event = await collection.find(id);
      if (event.deletedAt) {
        return null;
      }
      return event;
    } catch {
      return null;
    }
  },

  async findByOrganizationId(organizationId: string): Promise<Event[]> {
    const collection = database.get<Event>("events");
    return await collection
      .query(
        Q.where("organization_id", organizationId),
        Q.where("deleted_at", null),
        Q.sortBy("start_date", Q.desc)
      )
      .fetch();
  },

  async findBySchoolId(schoolId: string): Promise<Event[]> {
    const collection = database.get<Event>("events");
    return await collection
      .query(
        Q.where("school_id", schoolId),
        Q.where("deleted_at", null),
        Q.sortBy("start_date", Q.desc)
      )
      .fetch();
  },

  async findUpcoming(organizationId: string): Promise<Event[]> {
    const collection = database.get<Event>("events");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await collection
      .query(
        Q.where("organization_id", organizationId),
        Q.where("deleted_at", null),
        Q.where("start_date", Q.gte(today.getTime())),
        Q.where("status", "active"),
        Q.sortBy("start_date", Q.asc)
      )
      .fetch();
  },

  async findHistorical(organizationId: string): Promise<Event[]> {
    const collection = database.get<Event>("events");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await collection
      .query(
        Q.where("organization_id", organizationId),
        Q.where("deleted_at", null),
        Q.where("end_date", Q.lt(today.getTime())),
        Q.sortBy("start_date", Q.desc)
      )
      .fetch();
  },

  async update(id: string, data: Partial<Event>): Promise<Event> {
    const collection = database.get<Event>("events");
    const event = await collection.find(id);
    return await database.write(async () => {
      return await event.update((record) => {
        Object.assign(record, data);
      });
    });
  },

  async softDelete(id: string): Promise<void> {
    const collection = database.get<Event>("events");
    const event = await collection.find(id);
    await database.write(async () => {
      await event.update((record) => {
        record.deletedAt = new Date();
      });
    });
  },

  async cancel(id: string): Promise<Event> {
    const collection = database.get<Event>("events");
    const event = await collection.find(id);
    return await database.write(async () => {
      return await event.update((record) => {
        record.status = "cancelled";
      });
    });
  },

  // Observable methods for reactive UI
  observeByOrganizationId(organizationId: string) {
    const collection = database.get<Event>("events");
    return collection
      .query(
        Q.where("organization_id", organizationId),
        Q.where("deleted_at", null),
        Q.sortBy("start_date", Q.desc)
      )
      .observe();
  },

  observeUpcoming(organizationId: string) {
    const collection = database.get<Event>("events");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return collection
      .query(
        Q.where("organization_id", organizationId),
        Q.where("deleted_at", null),
        Q.where("start_date", Q.gte(today.getTime())),
        Q.where("status", "active"),
        Q.sortBy("start_date", Q.asc)
      )
      .observe();
  },

  observeById(id: string) {
    const collection = database.get<Event>("events");
    return collection.findAndObserve(id);
  },

  async findByIds(ids: string[]): Promise<Event[]> {
    if (ids.length === 0) return [];
    const collection = database.get<Event>("events");
    return await collection.query(Q.where("id", Q.oneOf(ids))).fetch();
  },
};
