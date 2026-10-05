import { database } from "@/database";
import Event, { EVENT_STATUS, EVENT_VISIBILITY } from "@/database/models/Event";
import type EventParticipant from "@/database/models/EventParticipant";
import type SchoolMember from "@/database/models/SchoolMember";
import { Q } from "@nozbe/watermelondb";
import { switchMap } from "rxjs/operators";
import { v4 as uuidv4 } from "uuid";

/** Columns whose edits must re-render "next up" views. */
const NEXT_UP_COLUMNS = ["name", "address", "start_date", "end_date", "status", "visibility", "school_id"];

const activeFromClauses = (fromTimestamp: number) => [
  Q.where("deleted_at", null),
  Q.where("status", EVENT_STATUS.ACTIVE),
  Q.where("end_date", Q.gte(fromTimestamp)),
  Q.sortBy("start_date", Q.asc),
];

/** Not deleted, overlapping [from, to] (an event covers start_date..end_date). */
const rangeClauses = (fromTimestamp: number, toTimestamp: number) => [
  Q.where("deleted_at", null),
  Q.where("start_date", Q.lte(toTimestamp)),
  Q.where("end_date", Q.gte(fromTimestamp)),
  Q.sortBy("start_date", Q.asc),
];

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

  /** Active events in the organization that end on or after `fromTimestamp` (ongoing included). */
  observeActiveFromByOrganization(organizationId: string, fromTimestamp: number) {
    return database
      .get<Event>("events")
      .query(Q.where("organization_id", organizationId), ...activeFromClauses(fromTimestamp))
      .observeWithColumns(NEXT_UP_COLUMNS);
  },

  /**
   * Active events from `fromTimestamp` that concern a school: organization
   * events, its own school events, and whitelist events with at least one
   * participant who is a member of the school.
   */
  observeActiveFromForSchool(schoolId: string, organizationId: string, fromTimestamp: number) {
    return database
      .get<SchoolMember>("school_members")
      .query(Q.where("school_id", schoolId), Q.where("deleted_at", null))
      .observe()
      .pipe(
        switchMap((members) =>
          database
            .get<EventParticipant>("event_participants")
            .query(
              Q.where("school_member_id", Q.oneOf(members.map((m) => m.id))),
              Q.where("deleted_at", null),
            )
            .observe(),
        ),
        switchMap((participants) =>
          database
            .get<Event>("events")
            .query(
              Q.where("organization_id", organizationId),
              Q.or(
                Q.where("visibility", EVENT_VISIBILITY.ORGANIZATION),
                Q.and(
                  Q.where("visibility", EVENT_VISIBILITY.SCHOOL),
                  Q.where("school_id", schoolId),
                ),
                Q.and(
                  Q.where("visibility", EVENT_VISIBILITY.WHITELIST),
                  Q.where("id", Q.oneOf([...new Set(participants.map((p) => p.eventId))])),
                ),
              ),
              ...activeFromClauses(fromTimestamp),
            )
            .observeWithColumns(NEXT_UP_COLUMNS),
        ),
      );
  },

  /** Active events from `fromTimestamp` the member takes part in (same audience as /user/events). */
  observeActiveFromForMember(schoolMemberId: string, fromTimestamp: number) {
    return database
      .get<EventParticipant>("event_participants")
      .query(Q.where("school_member_id", schoolMemberId), Q.where("deleted_at", null))
      .observe()
      .pipe(
        switchMap((participants) =>
          database
            .get<Event>("events")
            .query(
              Q.where("id", Q.oneOf(participants.map((p) => p.eventId))),
              ...activeFromClauses(fromTimestamp),
            )
            .observeWithColumns(NEXT_UP_COLUMNS),
        ),
      );
  },

  /** Events in the organization overlapping [fromTimestamp, toTimestamp] (cancelled included), for the calendar. */
  observeInRangeByOrganization(organizationId: string, fromTimestamp: number, toTimestamp: number) {
    return database
      .get<Event>("events")
      .query(Q.where("organization_id", organizationId), ...rangeClauses(fromTimestamp, toTimestamp))
      .observeWithColumns(NEXT_UP_COLUMNS);
  },

  /** Events the member takes part in overlapping [fromTimestamp, toTimestamp] (cancelled included). */
  observeInRangeForMember(schoolMemberId: string, fromTimestamp: number, toTimestamp: number) {
    return database
      .get<EventParticipant>("event_participants")
      .query(Q.where("school_member_id", schoolMemberId), Q.where("deleted_at", null))
      .observe()
      .pipe(
        switchMap((participants) =>
          database
            .get<Event>("events")
            .query(
              Q.where("id", Q.oneOf(participants.map((p) => p.eventId))),
              ...rangeClauses(fromTimestamp, toTimestamp),
            )
            .observeWithColumns(NEXT_UP_COLUMNS),
        ),
      );
  },

  async findByIds(ids: string[]): Promise<Event[]> {
    if (ids.length === 0) return [];
    const collection = database.get<Event>("events");
    return await collection
      .query(Q.where("id", Q.oneOf(ids)), Q.where("deleted_at", null))
      .fetch();
  },
};
