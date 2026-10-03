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
import type Training from "./Training";
import type { TrainingVisibility } from "./Training";

export default class TrainingSeries extends Model {
  static table = "training_series";
  static associations = {
    organizations: { type: "belongs_to" as const, key: "organization_id" },
    schools: { type: "belongs_to" as const, key: "school_id" },
    trainings: { type: "has_many" as const, foreignKey: "series_id" },
  };

  @field("organization_id") organizationId!: string;
  @field("school_id") schoolId?: string;
  @field("name") name!: string;
  @field("location") location?: string;
  @field("visibility") visibility!: TrainingVisibility;
  /** JSON string array of school_member ids (whitelist audience). */
  @field("invitee_ids") inviteeIds!: string;
  @date("start_date") startDate!: Date;
  @date("end_date") endDate!: Date;
  /** JSON string of SeriesRule[]. */
  @field("rules") rules!: string;
  /** The series this one continues (Extend beyond the window, or a "this and following" edit). */
  @field("previous_series_id") previousSeriesId?: string;
  @field("created_by") createdBy!: string;

  @relation("organizations", "organization_id") organization!: Organization;
  @relation("schools", "school_id") school?: School;
  @children("trainings") trainings!: Training[];

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
  @date("deleted_at") deletedAt?: Date;
}
