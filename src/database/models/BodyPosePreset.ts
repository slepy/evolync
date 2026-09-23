import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";
import type { PresetBoneData } from "@/modules/threed/types";

export default class BodyPosePreset extends Model {
  static table = "body_pose_presets";

  @field("user_id") userId!: string;
  @field("name") name!: string;
  @field("body_part_type") bodyPartType!: string;
  @field("data") data!: string;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
  @date("deleted_at") deletedAt?: Date;

  get presetData(): PresetBoneData {
    return JSON.parse(this.data);
  }
}
