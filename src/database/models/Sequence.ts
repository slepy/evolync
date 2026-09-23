import type { Query } from "@nozbe/watermelondb";
import { Model } from "@nozbe/watermelondb";
import {
  children,
  date,
  field,
  readonly,
} from "@nozbe/watermelondb/decorators";
import type SequenceStep from "./SequenceStep";

export default class Sequence extends Model {
  static table = "sequences";
  static associations = {
    sequence_steps: {
      type: "has_many" as const,
      foreignKey: "sequence_id",
    },
  };

  @field("user_id") userId!: string;
  @field("title") title!: string;
  @field("description") description?: string;
  @field("cover_image_url") coverImageUrl?: string;

  @children("sequence_steps") steps!: Query<SequenceStep>;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
  @date("deleted_at") deletedAt?: Date;
}
