// ============================================================================
// Attendance Module Exports
// ============================================================================

// Components
export {
  AttendanceStats,
  AttendanceSessionsScreen,
  AttendanceSessionScreen,
  AttendanceCreateScreen,
  StudentAttendanceScreen,
} from "./components";

// Constants
export { STATUS_CONFIG as ATTENDANCE_STATUS_CONFIG } from "./constants";

// Repositories
export {
  TrainingSessionRepository,
  AttendanceRecordRepository,
} from "./repositories";

// Hooks
export {
  useTrainingSessions,
  useAttendance,
  useTodaySession,
  useStudentAttendance,
} from "./hooks";
export type { AttendanceWithMember, StudentAttendanceItem } from "./hooks";

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
  bulkSaveAttendanceList,
  bulkUpdateAttendanceStatus,
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
