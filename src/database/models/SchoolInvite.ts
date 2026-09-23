import { Model } from "@nozbe/watermelondb";
import {
  date,
  readonly,
  text,
  relation,
} from "@nozbe/watermelondb/decorators";
import School from "./School";

export default class SchoolInvite extends Model {
  static table = "school_invites";
  static associations = {
    schools: { type: "belongs_to" as const, key: "school_id" },
  };

  @text("school_id") schoolId!: string;
  @text("code") code!: string;
  @date("expires_at") expiresAt!: number;
  @text("created_by") createdBy!: string;
  @text("role_id") roleId?: string;
  @readonly @date("created_at") createdAt!: number;
  @readonly @date("updated_at") updatedAt!: number;
  @date("deleted_at") deletedAt?: number;

  @relation("schools", "school_id") school!: School;
}
