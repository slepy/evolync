import { Model } from "@nozbe/watermelondb";
import { date, field, readonly, relation } from "@nozbe/watermelondb/decorators";
import type SchoolMember from "./SchoolMember";
import type Training from "./Training";

export default class TrainingInvitee extends Model {
  static table = "training_invitees";
  static associations = {
    trainings: { type: "belongs_to" as const, key: "training_id" },
    school_members: { type: "belongs_to" as const, key: "school_member_id" },
  };

  @field("training_id") trainingId!: string;
  @field("school_member_id") schoolMemberId!: string;

  @relation("trainings", "training_id") training!: Training;
  @relation("school_members", "school_member_id") schoolMember!: SchoolMember;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
  @date("deleted_at") deletedAt?: Date;
}
