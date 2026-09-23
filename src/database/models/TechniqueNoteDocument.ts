import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export default class TechniqueNoteDocument extends Model {
  static table = "technique_note_documents";

  @field("user_id") userId!: string;
  @field("title") title!: string;
  @field("description") description?: string;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
  @date("deleted_at") deletedAt?: Date;
}
