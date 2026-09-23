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

/**
 * Gets or creates a training session for a specific date
 * Useful for "create today's session" flow
 */
export const getOrCreateSessionForDate = async (
  schoolId: string,
  date: string // ISO date string
): Promise<TrainingSession> => {
  const targetDate = new Date(date);

  // Check if session already exists for this date
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const existingSessions =
    await TrainingSessionRepository.findBySchoolIdAndDateRange(
      schoolId,
      startOfDay,
      endOfDay
    );

  if (existingSessions.length > 0) {
    return existingSessions[0];
  }

  // Create new session
  return createTrainingSession({ schoolId, date });
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
 */
export const deleteTrainingSession = async (
  sessionId: string
): Promise<void> => {
  // Soft delete all attendance records for this session
  await AttendanceRecordRepository.softDeleteBySessionId(sessionId);

  // Soft delete the session
  await TrainingSessionRepository.softDelete(sessionId);

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
 * @param data - Attendance data (sessionId, memberId, status)
 * @returns Created or updated AttendanceRecord
 */
export const upsertAttendanceRecord = async (
  data: UpsertAttendanceDto
): Promise<AttendanceRecord> => {
  // Check if record already exists
  const existingRecord = await AttendanceRecordRepository.findBySessionAndMember(
    data.trainingSessionId,
    data.schoolMemberId
  );

  let record: AttendanceRecord;

  if (existingRecord) {
    // Update existing record
    record = await AttendanceRecordRepository.update(existingRecord.id, {
      status: data.status,
    });
  } else {
    // Create new record
    record = await AttendanceRecordRepository.create({
      trainingSessionId: data.trainingSessionId,
      schoolMemberId: data.schoolMemberId,
      status: data.status,
    });
  }

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

/**
 * Bulk upsert attendance records for multiple members
 * Useful for "mark all present/absent" functionality
 */
export const bulkUpsertAttendance = async (
  sessionId: string,
  memberIds: string[],
  status: AttendanceStatus
): Promise<AttendanceRecord[]> => {
  // Upsert each member's attendance
  for (const memberId of memberIds) {
    await upsertAttendanceRecord({
      trainingSessionId: sessionId,
      schoolMemberId: memberId,
      status,
    });
  }

  sync().catch((err) => {
    console.error("[bulkUpsertAttendance] Sync failed:", err);
  });

  // Return fresh records from database
  return await getAttendanceForSession(sessionId);
};

/**
 * Bulk save attendance list for a session
 * Upserts each attendance record with the provided status
 */
export const bulkSaveAttendanceList = async (
  sessionId: string,
  attendanceList: Array<{ memberId: string; status: AttendanceStatus }>
): Promise<void> => {
  for (const item of attendanceList) {
    await upsertAttendanceRecord({
      trainingSessionId: sessionId,
      schoolMemberId: item.memberId,
      status: item.status,
    });
  }

  sync().catch((err) => {
    console.error("[bulkSaveAttendanceList] Sync failed:", err);
  });
};

/**
 * Bulk update attendance record statuses
 * Updates each record by ID with the new status
 */
export const bulkUpdateAttendanceStatus = async (
  updates: Array<{ recordId: string; status: AttendanceStatus }>
): Promise<void> => {
  for (const { recordId, status } of updates) {
    await AttendanceRecordRepository.update(recordId, { status });
  }

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
