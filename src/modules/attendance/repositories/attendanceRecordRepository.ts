import { database } from "@/database";
import AttendanceRecord from "@/database/models/AttendanceRecord";
import { Q } from "@nozbe/watermelondb";
import { v4 as uuidv4 } from "uuid";

export const AttendanceRecordRepository = {
  async create(data: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    const collection = database.get<AttendanceRecord>("attendance_records");
    return await database.write(async () => {
      return await collection.create((record) => {
        record._raw.id = uuidv4();
        Object.assign(record, data);
      });
    });
  },

  async findById(id: string): Promise<AttendanceRecord | null> {
    const collection = database.get<AttendanceRecord>("attendance_records");
    try {
      const record = await collection.find(id);
      if (record.deletedAt) {
        return null;
      }
      return record;
    } catch {
      return null;
    }
  },

  async findBySessionId(sessionId: string): Promise<AttendanceRecord[]> {
    const collection = database.get<AttendanceRecord>("attendance_records");
    return await collection
      .query(
        Q.where("training_session_id", sessionId),
        Q.where("deleted_at", null)
      )
      .fetch();
  },

  async findByMemberId(memberId: string): Promise<AttendanceRecord[]> {
    const collection = database.get<AttendanceRecord>("attendance_records");
    return await collection
      .query(
        Q.where("school_member_id", memberId),
        Q.where("deleted_at", null),
        Q.sortBy("created_at", Q.desc)
      )
      .fetch();
  },

  async findBySessionAndMember(
    sessionId: string,
    memberId: string
  ): Promise<AttendanceRecord | null> {
    const collection = database.get<AttendanceRecord>("attendance_records");
    const records = await collection
      .query(
        Q.where("training_session_id", sessionId),
        Q.where("school_member_id", memberId),
        Q.where("deleted_at", null)
      )
      .fetch();
    return records.length > 0 ? records[0] : null;
  },

  async update(
    id: string,
    data: Partial<AttendanceRecord>
  ): Promise<AttendanceRecord> {
    const collection = database.get<AttendanceRecord>("attendance_records");
    const record = await collection.find(id);
    return await database.write(async () => {
      return await record.update((r) => {
        Object.assign(r, data);
      });
    });
  },

  async softDelete(id: string): Promise<void> {
    const collection = database.get<AttendanceRecord>("attendance_records");
    const record = await collection.find(id);
    await database.write(async () => {
      await record.update((r) => {
        r.deletedAt = new Date();
      });
    });
  },

  async softDeleteBySessionId(sessionId: string): Promise<void> {
    const collection = database.get<AttendanceRecord>("attendance_records");
    const records = await collection
      .query(Q.where("training_session_id", sessionId))
      .fetch();

    await database.write(async () => {
      const operations = records.map((record) =>
        record.prepareUpdate((r) => {
          r.deletedAt = new Date();
        })
      );
      if (operations.length > 0) {
        await database.batch(operations);
      }
    });
  },

  // Observable methods for reactive UI
  observeBySessionId(sessionId: string) {
    const collection = database.get<AttendanceRecord>("attendance_records");
    return collection
      .query(
        Q.where("training_session_id", sessionId),
        Q.where("deleted_at", null)
      )
      .observe();
  },

  observeByMemberId(memberId: string) {
    const collection = database.get<AttendanceRecord>("attendance_records");
    return collection
      .query(
        Q.where("school_member_id", memberId),
        Q.where("deleted_at", null)
      )
      .observe();
  },

  observePresentBySessionIds(sessionIds: string[]) {
    const collection = database.get<AttendanceRecord>("attendance_records");
    return collection
      .query(
        Q.where("training_session_id", Q.oneOf(sessionIds)),
        Q.where("status", "present"),
        Q.where("deleted_at", null)
      )
      .observe();
  },

  observeBySessionIds(sessionIds: string[]) {
    const collection = database.get<AttendanceRecord>("attendance_records");
    return collection
      .query(
        Q.where("training_session_id", Q.oneOf(sessionIds)),
        Q.where("deleted_at", null)
      )
      .observe();
  },
};
