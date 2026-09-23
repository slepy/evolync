import type { Query } from "@nozbe/watermelondb";
import { Model } from "@nozbe/watermelondb";
import {
  children,
  date,
  field,
  readonly,
  relation,
} from "@nozbe/watermelondb/decorators";
import type { StepData } from "@/modules/threed/types";
import type Sequence from "./Sequence";
import type StepTechnique from "./StepTechnique";

export default class SequenceStep extends Model {
  static table = "sequence_steps";
  static associations = {
    sequences: { type: "belongs_to" as const, key: "sequence_id" },
    step_techniques: {
      type: "has_many" as const,
      foreignKey: "step_id",
    },
  };

  @field("sequence_id") sequenceId!: string;
  @field("order_index") orderIndex!: number;
  @field("duration_ms") durationMs!: number;
  @field("data") data?: string;

  @relation("sequences", "sequence_id") sequence!: Sequence;
  @children("step_techniques") stepTechniques!: Query<StepTechnique>;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
  @date("deleted_at") deletedAt?: Date;

  get stepData(): StepData | null {
    if (!this.data) return null;
    return JSON.parse(this.data);
  }
}
