import { database } from "@/database";
import type Event from "@/database/models/Event";
import EventType from "@/database/models/EventType";
import { Q } from "@nozbe/watermelondb";
import { map } from "rxjs/operators";
import { v4 as uuidv4 } from "uuid";
import type { CreateEventTypeDto } from "../types/dto";

const byName = (a: EventType, b: EventType) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" });

export const EventTypeRepository = {
  async create(data: CreateEventTypeDto): Promise<EventType> {
    const collection = database.get<EventType>("event_types");
    return await database.write(async () => {
      return await collection.create((record) => {
        record._raw.id = uuidv4();
        record.organizationId = data.organizationId;
        record.name = data.name;
        record.createdBy = data.createdBy;
      });
    });
  },

  async update(id: string, data: { name: string }): Promise<EventType> {
    const record = await database.get<EventType>("event_types").find(id);
    return await database.write(async () => {
      return await record.update((r) => {
        r.name = data.name;
      });
    });
  },

  async softDelete(id: string): Promise<void> {
    const record = await database.get<EventType>("event_types").find(id);
    await database.write(async () => {
      await record.update((r) => {
        r.deletedAt = new Date();
      });
    });
  },

  /** Deleted types included: an event may still point at one and shows its name. */
  async findById(id: string): Promise<EventType | null> {
    try {
      return await database.get<EventType>("event_types").find(id);
    } catch {
      return null;
    }
  },

  async findByOrganizationId(organizationId: string): Promise<EventType[]> {
    const rows = await database
      .get<EventType>("event_types")
      .query(Q.where("organization_id", organizationId), Q.where("deleted_at", null))
      .fetch();
    return rows.sort(byName);
  },

  /** The organization's types, by name (case-insensitive). */
  observeByOrganizationId(organizationId: string) {
    return database
      .get<EventType>("event_types")
      .query(Q.where("organization_id", organizationId), Q.where("deleted_at", null))
      .observeWithColumns(["name"])
      .pipe(map((rows) => [...rows].sort(byName)));
  },

  /** Types by id for display, deleted ones included (their events keep the name). */
  observeByIds(ids: string[]) {
    return database
      .get<EventType>("event_types")
      .query(Q.where("id", Q.oneOf(ids)))
      .observeWithColumns(["name", "deleted_at"]);
  },

  /** Events (not deleted) of this type: a type in use cannot be deleted. */
  async countActiveEvents(typeId: string): Promise<number> {
    return await database
      .get<Event>("events")
      .query(Q.where("type_id", typeId), Q.where("deleted_at", null))
      .fetchCount();
  },
};
