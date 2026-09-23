import { Model } from "@nozbe/watermelondb";
import { date, field, readonly, relation } from "@nozbe/watermelondb/decorators";
import type SchoolMember from "./SchoolMember";
import type TrainingSession from "./TrainingSession";

export type AttendanceStatus = "present" | "absent" | "excused";

export const AttendanceStatus = {
  PRESENT: "present" as const,
  ABSENT: "absent" as const,
  EXCUSED: "excused" as const,
};

/** Default status for new attendance (present by default) */
export const DEFAULT_ATTENDANCE_STATUS: AttendanceStatus = AttendanceStatus.PRESENT;

/** Status cycle for toggling: present → absent → excused → present */
export const STATUS_CYCLE: AttendanceStatus[] = [
  AttendanceStatus.PRESENT,
  AttendanceStatus.ABSENT,
  AttendanceStatus.EXCUSED,
];

export default class AttendanceRecord extends Model {
  static table = "attendance_records";
  static associations = {
    training_sessions: {
      type: "belongs_to" as const,
      key: "training_session_id",
    },
    school_members: { type: "belongs_to" as const, key: "school_member_id" },
  };

  @field("training_session_id") trainingSessionId!: string;
  @field("school_member_id") schoolMemberId!: string;
  @field("status") status!: AttendanceStatus;

  @relation("training_sessions", "training_session_id")
  session!: TrainingSession;
  @relation("school_members", "school_member_id") member!: SchoolMember;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
  @date("deleted_at") deletedAt?: Date;
}
