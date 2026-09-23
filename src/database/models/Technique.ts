import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";
import type { TechniqueData, BodyPart } from "@/modules/threed/types";

export default class Technique extends Model {
  static table = "techniques";

  @field("user_id") userId!: string;
  @field("title") title!: string;
  @field("description") description?: string;
  @field("body_part") bodyPart!: BodyPart;
  @field("data") data!: string;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
  @date("deleted_at") deletedAt?: Date;

  get techniqueData(): TechniqueData {
    return JSON.parse(this.data);
  }
}
