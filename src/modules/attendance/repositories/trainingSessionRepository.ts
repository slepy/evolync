import { database } from "@/database";
import TrainingSession from "@/database/models/TrainingSession";
import { Q } from "@nozbe/watermelondb";
import { v4 as uuidv4 } from "uuid";

export const TrainingSessionRepository = {
  async create(data: Partial<TrainingSession>): Promise<TrainingSession> {
    const sessionsCollection =
      database.get<TrainingSession>("training_sessions");
    return await database.write(async () => {
      return await sessionsCollection.create((record) => {
        record._raw.id = uuidv4();
        Object.assign(record, data);
      });
    });
  },

  async findById(id: string): Promise<TrainingSession | null> {
    const sessionsCollection =
      database.get<TrainingSession>("training_sessions");
    try {
      const session = await sessionsCollection.find(id);
      if (session.deletedAt) {
        return null;
      }
      return session;
    } catch {
      return null;
    }
  },

  async findBySchoolId(schoolId: string): Promise<TrainingSession[]> {
    const sessionsCollection =
      database.get<TrainingSession>("training_sessions");
    return await sessionsCollection
      .query(
        Q.where("school_id", schoolId),
        Q.where("deleted_at", null),
        Q.sortBy("date", Q.desc)
      )
      .fetch();
  },

  async findBySchoolIdAndDateRange(
    schoolId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TrainingSession[]> {
    const sessionsCollection =
      database.get<TrainingSession>("training_sessions");
    return await sessionsCollection
      .query(
        Q.where("school_id", schoolId),
        Q.where("deleted_at", null),
        Q.where("date", Q.gte(startDate.getTime())),
        Q.where("date", Q.lte(endDate.getTime()))
      )
      .fetch();
  },

  async update(
    id: string,
    data: Partial<TrainingSession>
  ): Promise<TrainingSession> {
    const sessionsCollection =
      database.get<TrainingSession>("training_sessions");
    const session = await sessionsCollection.find(id);
    return await database.write(async () => {
      return await session.update((record) => {
        Object.assign(record, data);
      });
    });
  },

  async softDelete(id: string): Promise<void> {
    const sessionsCollection =
      database.get<TrainingSession>("training_sessions");
    const session = await sessionsCollection.find(id);
    await database.write(async () => {
      await session.update((record) => {
        record.deletedAt = new Date();
      });
    });
  },

  // Observable methods for reactive UI
  observeBySchoolId(schoolId: string) {
    const sessionsCollection =
      database.get<TrainingSession>("training_sessions");
    return sessionsCollection
      .query(
        Q.where("school_id", schoolId),
        Q.where("deleted_at", null),
        Q.sortBy("date", Q.desc)
      )
      .observe();
  },

  observeById(id: string) {
    const sessionsCollection =
      database.get<TrainingSession>("training_sessions");
    return sessionsCollection.findAndObserve(id);
  },

  observeTodayBySchoolId(schoolId: string) {
    const sessionsCollection =
      database.get<TrainingSession>("training_sessions");
    // UTC-day boundaries, not device-local — every device agrees on which
    // calendar day "today" is regardless of timezone offset.
    const now = new Date();
    const todayStart = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0, 0, 0, 0
    );
    const tomorrowStart = todayStart + 24 * 60 * 60 * 1000;

    return sessionsCollection
      .query(
        Q.where("school_id", schoolId),
        Q.where("deleted_at", null),
        Q.where("date", Q.gte(todayStart)),
        Q.where("date", Q.lt(tomorrowStart))
      )
      .observe();
  },

  async findByIds(ids: string[]): Promise<TrainingSession[]> {
    if (ids.length === 0) return [];
    const sessionsCollection =
      database.get<TrainingSession>("training_sessions");
    return await sessionsCollection
      .query(Q.where("id", Q.oneOf(ids)), Q.where("deleted_at", null))
      .fetch();
  },
};
