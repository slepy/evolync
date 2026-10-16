import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

/** Instructor-defined type of an event (Seminar, Camp…), shared by the organization. */
export default class EventType extends Model {
  static table = "event_types";
  static associations = {
    organizations: { type: "belongs_to" as const, key: "organization_id" },
  };

  @field("organization_id") organizationId!: string;
  @field("name") name!: string;
  @field("created_by") createdBy!: string;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
  @date("deleted_at") deletedAt?: Date;
}
