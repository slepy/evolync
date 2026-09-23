import { tableSchema } from "@nozbe/watermelondb";

export const notesSchema = [
  tableSchema({
    name: "technique_note_documents",
    columns: [
      { name: "user_id", type: "string", isIndexed: true },
      { name: "title", type: "string" },
      { name: "description", type: "string", isOptional: true },
      { name: "created_at", type: "number" },
      { name: "updated_at", type: "number" },
      { name: "deleted_at", type: "number", isOptional: true },
    ],
  }),
  tableSchema({
    name: "technique_note_rows",
    columns: [
      { name: "document_id", type: "string", isIndexed: true },
      { name: "order_index", type: "number" },
      { name: "person_1_text", type: "string" },
      { name: "person_2_text", type: "string" },
      { name: "direction", type: "string" }, // "left" | "right"
      { name: "created_at", type: "number" },
      { name: "updated_at", type: "number" },
      { name: "deleted_at", type: "number", isOptional: true },
    ],
  }),
];
