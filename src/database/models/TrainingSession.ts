import { Model } from "@nozbe/watermelondb";
import {
  children,
  date,
  field,
  readonly,
  relation,
} from "@nozbe/watermelondb/decorators";
import type AttendanceRecord from "./AttendanceRecord";
import type School from "./School";

export default class TrainingSession extends Model {
  static table = "training_sessions";
  static associations = {
    schools: { type: "belongs_to" as const, key: "school_id" },
    attendance_records: {
      type: "has_many" as const,
      foreignKey: "training_session_id",
    },
  };

  @field("school_id") schoolId!: string;
  @date("date") sessionDate!: Date;
  @field("notes") notes?: string;

  @relation("schools", "school_id") school!: School;
  @children("attendance_records") records!: AttendanceRecord[];

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
  @date("deleted_at") deletedAt?: Date;
}
