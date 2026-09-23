// ============================================================================
// Attendance Module Exports
// ============================================================================

// Components
export {
  TrainingSessionCard,
  AttendanceListItem,
  AttendanceStats,
} from "./components";

// Constants
export { STATUS_CONFIG as ATTENDANCE_STATUS_CONFIG } from "./constants";

// Repositories
export {
  TrainingSessionRepository,
  AttendanceRecordRepository,
} from "./repositories";

// Hooks
export { useTrainingSessions, useAttendance } from "./hooks";
export type { AttendanceWithMember } from "./hooks";

// Services
export {
  createTrainingSession,
  getTrainingSessionById,
  getTrainingSessionsForSchool,
  getOrCreateSessionForDate,
  updateTrainingSessionNotes,
  deleteTrainingSession,
  upsertAttendanceRecord,
  getAttendanceForSession,
  bulkUpsertAttendance,
  createSessionWithAttendance,
} from "./services";

// Validation
export {
  createTrainingSessionSchema,
  attendanceStatusSchema,
} from "./validation";
export type {
  CreateTrainingSessionFormValues,
  AttendanceStatusFormValue,
} from "./validation";

// Types
export type {
  CreateTrainingSessionDto,
  UpdateTrainingSessionDto,
  UpsertAttendanceDto,
  TrainingSessionResponseDto,
  AttendanceRecordResponseDto,
  SessionWithAttendanceDto,
} from "./types";
