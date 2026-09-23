import { Model } from "@nozbe/watermelondb";
import { date, field, readonly, relation } from "@nozbe/watermelondb/decorators";
import type { Vec3, Quat } from "@/modules/threed/types";
import type SequenceStep from "./SequenceStep";
import type Technique from "./Technique";

export default class StepTechnique extends Model {
  static table = "step_techniques";
  static associations = {
    sequence_steps: { type: "belongs_to" as const, key: "step_id" },
    techniques: { type: "belongs_to" as const, key: "technique_id" },
  };

  @field("step_id") stepId!: string;
  @field("technique_id") techniqueId!: string;
  @field("model_slot") modelSlot!: number;
  @field("root_position") rootPosition!: string;
  @field("root_rotation") rootRotation!: string;

  @relation("sequence_steps", "step_id") step!: SequenceStep;
  @relation("techniques", "technique_id") technique!: Technique;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
  @date("deleted_at") deletedAt?: Date;

  get rootPositionData(): Vec3 {
    return JSON.parse(this.rootPosition);
  }

  get rootRotationData(): Quat {
    return JSON.parse(this.rootRotation);
  }
}
