import { Model } from "@nozbe/watermelondb";
import {
  children,
  date,
  field,
  readonly,
  relation,
} from "@nozbe/watermelondb/decorators";
import type Organization from "./Organization";
import type School from "./School";
import type TrainingInvitee from "./TrainingInvitee";
import type TrainingSeries from "./TrainingSeries";

export const TRAINING_STATUS = {
  ACTIVE: "active",
  CANCELLED: "cancelled",
} as const;

export const TRAINING_VISIBILITY = {
  ORGANIZATION: "organization",
  SCHOOL: "school",
  WHITELIST: "whitelist",
} as const;

export type TrainingStatus =
  (typeof TRAINING_STATUS)[keyof typeof TRAINING_STATUS];
export type TrainingVisibility =
  (typeof TRAINING_VISIBILITY)[keyof typeof TRAINING_VISIBILITY];

export default class Training extends Model {
  static table = "trainings";
  static associations = {
    organizations: { type: "belongs_to" as const, key: "organization_id" },
    schools: { type: "belongs_to" as const, key: "school_id" },
    training_series: { type: "belongs_to" as const, key: "series_id" },
    training_invitees: { type: "has_many" as const, foreignKey: "training_id" },
  };

  @field("organization_id") organizationId!: string;
  @field("school_id") schoolId?: string;
  @field("series_id") seriesId?: string;
  @field("name") name!: string;
  @date("date") date!: Date;
  @field("start_time") startTime!: string;
  @field("end_time") endTime!: string;
  @field("location") location?: string;
  @field("visibility") visibility!: TrainingVisibility;
  @field("status") status!: TrainingStatus;
  @field("created_by") createdBy!: string;

  @relation("organizations", "organization_id") organization!: Organization;
  @relation("schools", "school_id") school?: School;
  @relation("training_series", "series_id") series?: TrainingSeries;
  @children("training_invitees") invitees!: TrainingInvitee[];

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
  @date("deleted_at") deletedAt?: Date;
}
