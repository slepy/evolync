import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";
import type { AttackDirection } from "@/modules/techniques/notes/types";

export default class TechniqueNoteRow extends Model {
  static table = "technique_note_rows";

  @field("document_id") documentId!: string;
  @field("order_index") orderIndex!: number;
  @field("person_1_text") person1Text!: string;
  @field("person_2_text") person2Text!: string;
  @field("direction") direction!: AttackDirection;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
  @date("deleted_at") deletedAt?: Date;
}
