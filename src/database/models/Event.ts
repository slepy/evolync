import { Model } from "@nozbe/watermelondb";
import {
  children,
  date,
  field,
  readonly,
  relation,
} from "@nozbe/watermelondb/decorators";
import type EventParticipant from "./EventParticipant";
import type Organization from "./Organization";
import type School from "./School";

export const EVENT_STATUS = {
  ACTIVE: "active",
  CANCELLED: "cancelled",
} as const;

export const EVENT_VISIBILITY = {
  ORGANIZATION: "organization",
  SCHOOL: "school",
  WHITELIST: "whitelist",
} as const;

export type EventStatus = (typeof EVENT_STATUS)[keyof typeof EVENT_STATUS];
export type EventVisibility =
  (typeof EVENT_VISIBILITY)[keyof typeof EVENT_VISIBILITY];

export default class Event extends Model {
  static table = "events";
  static associations = {
    organizations: { type: "belongs_to" as const, key: "organization_id" },
    schools: { type: "belongs_to" as const, key: "school_id" },
    event_participants: {
      type: "has_many" as const,
      foreignKey: "event_id",
    },
  };

  @field("organization_id") organizationId!: string;
  @field("school_id") schoolId?: string;
  @field("name") name!: string;
  /** Optional in the database (events created before types); the form requires one. */
  @field("type_id") typeId?: string;
  @field("short_note") shortNote?: string;
  @field("address") address?: string;
  @date("start_date") startDate!: Date;
  @date("end_date") endDate!: Date;
  @field("price") price!: number;
  @field("currency") currency!: string;
  @field("visibility") visibility!: EventVisibility;
  @field("status") status!: EventStatus;
  /** Participants can be marked as taking the exam (a missing value reads as false). */
  @field("exams_planned") examsPlanned!: boolean;
  @field("created_by") createdBy!: string;

  @relation("organizations", "organization_id") organization!: Organization;
  @relation("schools", "school_id") school?: School;
  @children("event_participants") participants!: EventParticipant[];

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
  @date("deleted_at") deletedAt?: Date;
}
