import type { AttendanceStatus } from "@/database/models/AttendanceRecord";

/**
 * DTO for creating a new training session
 */
export interface CreateTrainingSessionDto {
  schoolId: string;
  date: string; // ISO date string (YYYY-MM-DD)
  notes?: string;
}

/**
 * DTO for updating a training session
 */
export interface UpdateTrainingSessionDto {
  notes?: string;
}

/**
 * DTO for creating/updating an attendance record
 */
export interface UpsertAttendanceDto {
  trainingSessionId: string;
  schoolMemberId: string;
  status: AttendanceStatus;
}

/**
 * Response DTO for training session with attendance records
 */
export interface TrainingSessionResponseDto {
  id: string;
  schoolId: string;
  date: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Response DTO for attendance record with member info
 */
export interface AttendanceRecordResponseDto {
  id: string;
  trainingSessionId: string;
  schoolMemberId: string;
  memberDisplayName?: string;
  status: AttendanceStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Combined response for a session with all attendance records
 */
export interface SessionWithAttendanceDto {
  session: TrainingSessionResponseDto;
  records: AttendanceRecordResponseDto[];
}
