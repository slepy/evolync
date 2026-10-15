import { database } from "@/database";
import { sync } from "@/database/sync";
import AttendanceRecord, {
  type AttendanceStatus,
} from "@/database/models/AttendanceRecord";
import TrainingSession from "@/database/models/TrainingSession";
import { v4 as uuidv4 } from "uuid";

import type {
  CreateTrainingSessionDto,
  UpsertAttendanceDto,
} from "../types/dto";
import {
  TrainingSessionRepository,
  AttendanceRecordRepository,
} from "../repositories";
import {
  attendanceStatusSchema,
  createTrainingSessionSchema,
} from "../validation";

// ============================================================================
// Training Sessions
// ============================================================================

/**
 * Creates a new training session for a school on a specific date
 *
 * @param data - Session data (schoolId, date, notes)
 * @returns Created TrainingSession
 */
export const createTrainingSession = async (
  data: CreateTrainingSessionDto
): Promise<TrainingSession> => {
  createTrainingSessionSchema.parse({ date: data.date, notes: data.notes });

  const session = await TrainingSessionRepository.create({
    schoolId: data.schoolId,
    sessionDate: new Date(data.date),
    notes: data.notes,
  });

  // Trigger background sync
  sync().catch((err) => {
    console.error("[createTrainingSession] Sync failed:", err);
  });

  return session;
};

/**
 * Gets a training session by ID
 */
export const getTrainingSessionById = async (
  sessionId: string
): Promise<TrainingSession | null> => {
  return TrainingSessionRepository.findById(sessionId);
};

/**
 * Gets all training sessions for a school, ordered by date descending
 */
export const getTrainingSessionsForSchool = async (
  schoolId: string
): Promise<TrainingSession[]> => {
  return TrainingSessionRepository.findBySchoolId(schoolId);
};

/** Start/end of the UTC calendar day containing `date`. */
const utcDayBounds = (date: Date): { start: Date; end: Date } => {
  const start = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0)
  );
  const end = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999)
  );
  return { start, end };
};

/**
 * Gets or creates a training session for a specific date
 * Useful for "create today's session" flow
 *
 * Session-per-day boundaries are computed in UTC (not device-local time) so
 * every device agrees on which calendar day a session belongs to, regardless
 * of local timezone offset.
 */
export const getOrCreateSessionForDate = async (
  schoolId: string,
  date: string // ISO date string
): Promise<TrainingSession> => {
  createTrainingSessionSchema.parse({ date });

  const targetDate = new Date(date);
  const { start: startOfDay, end: endOfDay } = utcDayBounds(targetDate);

  // Atomic check-then-create: the existence check and the creation happen
  // inside the same database.write() so two near-simultaneous calls for the
  // same school+date can't both miss the existing session and create two.
  let created = false;
  const session = await database.write(async () => {
    const existingSessions =
      await TrainingSessionRepository.findBySchoolIdAndDateRange(
        schoolId,
        startOfDay,
        endOfDay
      );

    if (existingSessions.length > 0) {
      return existingSessions[0];
    }

    const sessionsCollection = database.get<TrainingSession>("training_sessions");
    created = true;
    return await sessionsCollection.create((record) => {
      record._raw.id = uuidv4();
      record.schoolId = schoolId;
      record.sessionDate = targetDate;
    });
  });

  if (created) {
    sync().catch((err) => {
      console.error("[getOrCreateSessionForDate] Sync failed:", err);
    });
  }

  return session;
};

/**
 * Updates training session notes
 */
export const updateTrainingSessionNotes = async (
  sessionId: string,
  notes: string | undefined
): Promise<TrainingSession> => {
  const updated = await TrainingSessionRepository.update(sessionId, { notes });

  sync().catch((err) => {
    console.error("[updateTrainingSessionNotes] Sync failed:", err);
  });

  return updated;
};

/**
 * Soft deletes a training session and its attendance records
 *
 * Atomic: the session and all of its records commit in a single
 * database.batch(), or none do.
 */
export const deleteTrainingSession = async (
  sessionId: string
): Promise<void> => {
  const session = await database
    .get<TrainingSession>("training_sessions")
    .find(sessionId);
  const records = await AttendanceRecordRepository.findBySessionId(sessionId);
  const deletedAt = new Date();

  await database.write(async () => {
    await database.batch([
      ...records.map((record) =>
        record.prepareUpdate((r) => {
          r.deletedAt = deletedAt;
        })
      ),
      session.prepareUpdate((s) => {
        s.deletedAt = deletedAt;
      }),
    ]);
  });

  sync().catch((err) => {
    console.error("[deleteTrainingSession] Sync failed:", err);
  });
};

// ============================================================================
// Attendance Records
// ============================================================================

/**
 * Upserts an attendance record (creates or updates)
 *
 * The existence check and the conditional create/update happen inside one
 * database.write() so two near-simultaneous calls for the same session+member
 * can't both miss the existing record and create a duplicate.
 *
 * @param data - Attendance data (sessionId, memberId, status)
 * @returns Created or updated AttendanceRecord
 */
export const upsertAttendanceRecord = async (
  data: UpsertAttendanceDto
): Promise<AttendanceRecord> => {
  attendanceStatusSchema.parse(data.status);

  const record = await database.write(async () => {
    const existingRecord =
      await AttendanceRecordRepository.findBySessionAndMember(
        data.trainingSessionId,
        data.schoolMemberId
      );

    if (existingRecord) {
      return await existingRecord.update((r) => {
        r.status = data.status;
      });
    }

    const collection = database.get<AttendanceRecord>("attendance_records");
    return await collection.create((r) => {
      r._raw.id = uuidv4();
      r.trainingSessionId = data.trainingSessionId;
      r.schoolMemberId = data.schoolMemberId;
      r.status = data.status;
    });
  });

  sync().catch((err) => {
    console.error("[upsertAttendanceRecord] Sync failed:", err);
  });

  return record;
};

/**
 * Gets all attendance records for a training session
 */
export const getAttendanceForSession = async (
  sessionId: string
): Promise<AttendanceRecord[]> => {
  return AttendanceRecordRepository.findBySessionId(sessionId);
};

/** Builds one batched find-or-create/update operation per (session, member, status) triple. */
const prepareUpsertOperations = async (
  sessionId: string,
  items: Array<{ memberId: string; status: AttendanceStatus }>
) => {
  items.forEach((item) => attendanceStatusSchema.parse(item.status));

  const existingRecords = await AttendanceRecordRepository.findBySessionId(sessionId);
  const existingByMember = new Map(
    existingRecords.map((r) => [r.schoolMemberId, r])
  );
  const collection = database.get<AttendanceRecord>("attendance_records");

  return items.map((item) => {
    const existing = existingByMember.get(item.memberId);
    if (existing) {
      return existing.prepareUpdate((r) => {
        r.status = item.status;
      });
    }
    return collection.prepareCreate((r) => {
      r._raw.id = uuidv4();
      r.trainingSessionId = sessionId;
      r.schoolMemberId = item.memberId;
      r.status = item.status;
    });
  });
};

/**
 * Bulk upsert attendance records for multiple members
 * Useful for "mark all present/absent" functionality
 *
 * Atomic: all records commit in a single database.batch(), or none do.
 */
export const bulkUpsertAttendance = async (
  sessionId: string,
  memberIds: string[],
  status: AttendanceStatus
): Promise<AttendanceRecord[]> => {
  const operations = await prepareUpsertOperations(
    sessionId,
    memberIds.map((memberId) => ({ memberId, status }))
  );

  await database.write(async () => {
    if (operations.length > 0) {
      await database.batch(operations);
    }
  });

  sync().catch((err) => {
    console.error("[bulkUpsertAttendance] Sync failed:", err);
  });

  return await getAttendanceForSession(sessionId);
};

/**
 * Bulk save attendance list for a session
 * Upserts each attendance record with the provided status
 *
 * Atomic: all records commit in a single database.batch(), or none do.
 */
export const bulkSaveAttendanceList = async (
  sessionId: string,
  attendanceList: Array<{ memberId: string; status: AttendanceStatus }>
): Promise<void> => {
  const operations = await prepareUpsertOperations(sessionId, attendanceList);

  await database.write(async () => {
    if (operations.length > 0) {
      await database.batch(operations);
    }
  });

  sync().catch((err) => {
    console.error("[bulkSaveAttendanceList] Sync failed:", err);
  });
};

/**
 * Bulk update attendance record statuses
 * Updates each record by ID with the new status
 *
 * Atomic: all records commit in a single database.batch(), or none do.
 */
export const bulkUpdateAttendanceStatus = async (
  updates: Array<{ recordId: string; status: AttendanceStatus }>
): Promise<void> => {
  updates.forEach((u) => attendanceStatusSchema.parse(u.status));

  const collection = database.get<AttendanceRecord>("attendance_records");
  const records = await Promise.all(
    updates.map((u) => collection.find(u.recordId))
  );
  const statusByRecordId = new Map(updates.map((u) => [u.recordId, u.status]));

  const operations = records.map((record) =>
    record.prepareUpdate((r) => {
      r.status = statusByRecordId.get(r.id)!;
    })
  );

  await database.write(async () => {
    if (operations.length > 0) {
      await database.batch(operations);
    }
  });

  sync().catch((err) => {
    console.error("[bulkUpdateAttendanceStatus] Sync failed:", err);
  });
};

/**
 * Creates a training session with attendance records in a single batch operation.
 * Used when creating a new session with initial attendance data.
 *
 * @param schoolId - School ID
 * @param sessionDate - Date of the session
 * @param attendanceList - List of members with their attendance status
 * @returns Created TrainingSession
 */
export const createSessionWithAttendance = async (
  schoolId: string,
  sessionDate: Date,
  attendanceList: Array<{ memberId: string; status: AttendanceStatus }>
): Promise<TrainingSession> => {
  attendanceList.forEach((item) => attendanceStatusSchema.parse(item.status));

  const sessionId = uuidv4();

  await database.write(async () => {
    const sessionsCollection = database.get<TrainingSession>("training_sessions");
    const recordsCollection = database.get<AttendanceRecord>("attendance_records");

    const operations: any[] = [];

    // Create the training session
    operations.push(
      sessionsCollection.prepareCreate((record) => {
        record._raw.id = sessionId;
        record.schoolId = schoolId;
        record.sessionDate = sessionDate;
      })
    );

    // Create attendance records
    for (const item of attendanceList) {
      operations.push(
        recordsCollection.prepareCreate((record) => {
          record._raw.id = uuidv4();
          record.trainingSessionId = sessionId;
          record.schoolMemberId = item.memberId;
          record.status = item.status;
        })
      );
    }

    await database.batch(operations);
  });

  // Trigger sync in background
  sync().catch((err) => {
    console.error("[createSessionWithAttendance] Sync error:", err);
  });

  // Return the created session
  const session = await TrainingSessionRepository.findById(sessionId);
  if (!session) {
    throw new Error("Failed to create session");
  }
  return session;
};
