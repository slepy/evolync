import { Model } from "@nozbe/watermelondb";
import { date, field, readonly, relation } from "@nozbe/watermelondb/decorators";
import type Event from "./Event";
import type SchoolMember from "./SchoolMember";

export const EVENT_PARTICIPANT_STATUS = {
  ABSENT: "absent",
  ATTENDING: "attending",
  PAID: "paid",
} as const;

export type EventParticipantStatus =
  (typeof EVENT_PARTICIPANT_STATUS)[keyof typeof EVENT_PARTICIPANT_STATUS];

export default class EventParticipant extends Model {
  static table = "event_participants";
  static associations = {
    events: { type: "belongs_to" as const, key: "event_id" },
    school_members: { type: "belongs_to" as const, key: "school_member_id" },
  };

  @field("event_id") eventId!: string;
  @field("school_member_id") schoolMemberId!: string;
  @field("status") status!: EventParticipantStatus;
  @field("status_changed_by") statusChangedBy?: string;

  @relation("events", "event_id") event!: Event;
  @relation("school_members", "school_member_id") schoolMember!: SchoolMember;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
  @date("deleted_at") deletedAt?: Date;
}
