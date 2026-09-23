import { tableSchema } from "@nozbe/watermelondb";

/**
 * WatermelonDB schema for Attendance module
 *
 * Two-table design:
 * - training_sessions: Groups attendance by school + date
 * - attendance_records: Individual attendance per member per session
 */
export const attendanceSchema = [
  tableSchema({
    name: "training_sessions",
    columns: [
      { name: "school_id", type: "string", isIndexed: true },
      { name: "date", type: "number" }, // Stored as timestamp
      { name: "notes", type: "string", isOptional: true },
      { name: "created_at", type: "number" },
      { name: "updated_at", type: "number" },
      { name: "deleted_at", type: "number", isOptional: true },
    ],
  }),
  tableSchema({
    name: "attendance_records",
    columns: [
      { name: "training_session_id", type: "string", isIndexed: true },
      { name: "school_member_id", type: "string", isIndexed: true },
      { name: "status", type: "string" }, // 'present', 'absent', 'excused'
      { name: "created_at", type: "number" },
      { name: "updated_at", type: "number" },
      { name: "deleted_at", type: "number", isOptional: true },
    ],
  }),
];
