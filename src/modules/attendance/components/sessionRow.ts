import { STATUS_CYCLE, type AttendanceStatus } from "@/database/models/AttendanceRecord";
import type SchoolMember from "@/database/models/SchoolMember";

export const nextStatus = (status: AttendanceStatus): AttendanceStatus =>
  STATUS_CYCLE[(STATUS_CYCLE.indexOf(status) + 1) % STATUS_CYCLE.length];

export interface AttendanceRow {
  member: SchoolMember;
  status: AttendanceStatus;
  /** Archived member: the historical status stays, it cannot be changed. */
  disabled: boolean;
}
