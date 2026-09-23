import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export default class Taggable extends Model {
  static table = "taggables";

  @field("tag_id") tagId!: string;
  @field("taggable_id") taggableId!: string;
  @field("taggable_type") taggableType!: string;

  @readonly @date("created_at") createdAt!: Date;
}
