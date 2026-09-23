import { tableSchema } from "@nozbe/watermelondb";

export const threedSchema = [
  tableSchema({
    name: "body_pose_presets",
    columns: [
      { name: "user_id", type: "string", isIndexed: true },
      { name: "name", type: "string" },
      { name: "body_part_type", type: "string" }, // 'hand' | 'foot'
      { name: "data", type: "string" }, // JSON string (PresetBoneData)
      { name: "created_at", type: "number" },
      { name: "updated_at", type: "number" },
      { name: "deleted_at", type: "number", isOptional: true },
    ],
  }),
  tableSchema({
    name: "techniques",
    columns: [
      { name: "user_id", type: "string", isIndexed: true },
      { name: "title", type: "string" },
      { name: "description", type: "string", isOptional: true },
      { name: "body_part", type: "string" }, // BodyPart
      { name: "data", type: "string" }, // JSON string (TechniqueData)
      { name: "created_at", type: "number" },
      { name: "updated_at", type: "number" },
      { name: "deleted_at", type: "number", isOptional: true },
    ],
  }),
  tableSchema({
    name: "sequences",
    columns: [
      { name: "user_id", type: "string", isIndexed: true },
      { name: "title", type: "string" },
      { name: "description", type: "string", isOptional: true },
      { name: "cover_image_url", type: "string", isOptional: true },
      { name: "created_at", type: "number" },
      { name: "updated_at", type: "number" },
      { name: "deleted_at", type: "number", isOptional: true },
    ],
  }),
  tableSchema({
    name: "sequence_steps",
    columns: [
      { name: "sequence_id", type: "string", isIndexed: true },
      { name: "order_index", type: "number" },
      { name: "duration_ms", type: "number" },
      { name: "data", type: "string", isOptional: true }, // JSON string (StepData)
      { name: "created_at", type: "number" },
      { name: "updated_at", type: "number" },
      { name: "deleted_at", type: "number", isOptional: true },
    ],
  }),
  tableSchema({
    name: "step_techniques",
    columns: [
      { name: "step_id", type: "string", isIndexed: true },
      { name: "technique_id", type: "string", isIndexed: true },
      { name: "model_slot", type: "number" }, // 0=Main, 1=Partner
      { name: "root_position", type: "string" }, // JSON string (Vec3)
      { name: "root_rotation", type: "string" }, // JSON string (Quat)
      { name: "created_at", type: "number" },
      { name: "updated_at", type: "number" },
      { name: "deleted_at", type: "number", isOptional: true },
    ],
  }),
];
