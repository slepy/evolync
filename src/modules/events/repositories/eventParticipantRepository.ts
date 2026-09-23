import { database } from "@/database";
import EventParticipant from "@/database/models/EventParticipant";
import type { EventParticipantStatus } from "@/database/models/EventParticipant";
import { Q } from "@nozbe/watermelondb";
import { v4 as uuidv4 } from "uuid";

export const EventParticipantRepository = {
  async create(data: Partial<EventParticipant>): Promise<EventParticipant> {
    const collection = database.get<EventParticipant>("event_participants");
    return await database.write(async () => {
      return await collection.create((record) => {
        record._raw.id = uuidv4();
        Object.assign(record, data);
      });
    });
  },

  async findById(id: string): Promise<EventParticipant | null> {
    const collection = database.get<EventParticipant>("event_participants");
    try {
      const participant = await collection.find(id);
      if (participant.deletedAt) {
        return null;
      }
      return participant;
    } catch {
      return null;
    }
  },

  async findByEventId(eventId: string): Promise<EventParticipant[]> {
    const collection = database.get<EventParticipant>("event_participants");
    return await collection
      .query(
        Q.where("event_id", eventId),
        Q.where("deleted_at", null)
      )
      .fetch();
  },

  async findByMemberId(schoolMemberId: string): Promise<EventParticipant[]> {
    const collection = database.get<EventParticipant>("event_participants");
    return await collection
      .query(
        Q.where("school_member_id", schoolMemberId),
        Q.where("deleted_at", null)
      )
      .fetch();
  },

  async findByEventAndMember(
    eventId: string,
    schoolMemberId: string
  ): Promise<EventParticipant | null> {
    const collection = database.get<EventParticipant>("event_participants");
    const results = await collection
      .query(
        Q.where("event_id", eventId),
        Q.where("school_member_id", schoolMemberId),
        Q.where("deleted_at", null)
      )
      .fetch();
    return results.length > 0 ? results[0] : null;
  },

  async findByEventIdAndStatus(
    eventId: string,
    status: EventParticipantStatus
  ): Promise<EventParticipant[]> {
    const collection = database.get<EventParticipant>("event_participants");
    return await collection
      .query(
        Q.where("event_id", eventId),
        Q.where("status", status),
        Q.where("deleted_at", null)
      )
      .fetch();
  },

  async countByEventIdAndStatus(
    eventId: string,
    status: EventParticipantStatus
  ): Promise<number> {
    const collection = database.get<EventParticipant>("event_participants");
    return await collection
      .query(
        Q.where("event_id", eventId),
        Q.where("status", status),
        Q.where("deleted_at", null)
      )
      .fetchCount();
  },

  async hasPaidParticipants(eventId: string): Promise<boolean> {
    const count = await this.countByEventIdAndStatus(eventId, "paid");
    return count > 0;
  },

  async update(
    id: string,
    data: Partial<EventParticipant>
  ): Promise<EventParticipant> {
    const collection = database.get<EventParticipant>("event_participants");
    const participant = await collection.find(id);
    return await database.write(async () => {
      return await participant.update((record) => {
        Object.assign(record, data);
      });
    });
  },

  async updateStatus(
    id: string,
    status: EventParticipantStatus,
    changedBy: string
  ): Promise<EventParticipant> {
    const collection = database.get<EventParticipant>("event_participants");
    const participant = await collection.find(id);
    return await database.write(async () => {
      return await participant.update((record) => {
        record.status = status;
        record.statusChangedBy = changedBy;
      });
    });
  },

  async softDelete(id: string): Promise<void> {
    const collection = database.get<EventParticipant>("event_participants");
    const participant = await collection.find(id);
    await database.write(async () => {
      await participant.update((record) => {
        record.deletedAt = new Date();
      });
    });
  },

  async createBatch(
    eventId: string,
    schoolMemberIds: string[],
    defaultStatus: EventParticipantStatus = "absent"
  ): Promise<EventParticipant[]> {
    const collection = database.get<EventParticipant>("event_participants");
    return await database.write(async () => {
      const created: EventParticipant[] = [];
      for (const memberId of schoolMemberIds) {
        // Check if already exists
        const existing = await collection
          .query(
            Q.where("event_id", eventId),
            Q.where("school_member_id", memberId),
            Q.where("deleted_at", null)
          )
          .fetch();

        if (existing.length === 0) {
          const participant = await collection.create((record) => {
            record._raw.id = uuidv4();
            record.eventId = eventId;
            record.schoolMemberId = memberId;
            record.status = defaultStatus;
          });
          created.push(participant);
        }
      }
      return created;
    });
  },

  // Observable methods for reactive UI
  // Uses observeWithColumns to detect status changes within existing records
  observeByEventId(eventId: string) {
    const collection = database.get<EventParticipant>("event_participants");
    return collection
      .query(
        Q.where("event_id", eventId),
        Q.where("deleted_at", null)
      )
      .observeWithColumns(["status"]);
  },

  observeByMemberId(schoolMemberId: string) {
    const collection = database.get<EventParticipant>("event_participants");
    return collection
      .query(
        Q.where("school_member_id", schoolMemberId),
        Q.where("deleted_at", null)
      )
      .observeWithColumns(["status"]);
  },
};
