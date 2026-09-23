import { tableSchema } from "@nozbe/watermelondb";

export const tagsSchema = [
  tableSchema({
    name: "tags",
    columns: [
      { name: "user_id", type: "string", isIndexed: true },
      { name: "name", type: "string" },
      { name: "color", type: "string" },
      { name: "created_at", type: "number" },
      { name: "updated_at", type: "number" },
      { name: "deleted_at", type: "number", isOptional: true },
    ],
  }),
  tableSchema({
    name: "taggables",
    columns: [
      { name: "tag_id", type: "string", isIndexed: true },
      { name: "taggable_id", type: "string", isIndexed: true },
      { name: "taggable_type", type: "string" },
      { name: "created_at", type: "number" },
    ],
  }),
];
