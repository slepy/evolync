import { tableSchema } from "@nozbe/watermelondb";

/**
 * WatermelonDB schema for the Notifications module.
 *
 * Rows are created server-side by Postgres triggers and arrive through sync;
 * the client only ever changes `read_at` and `deleted_at` (user removes a row).
 */
export const notificationsSchema = [
  tableSchema({
    name: "notifications",
    columns: [
      { name: "recipient_id", type: "string", isIndexed: true },
      { name: "school_id", type: "string", isOptional: true },
      { name: "type", type: "string" },
      { name: "entity_type", type: "string" },
      { name: "entity_id", type: "string" },
      { name: "payload", type: "string" }, // JSON string
      { name: "read_at", type: "number", isOptional: true, isIndexed: true },
      { name: "created_at", type: "number" },
      { name: "updated_at", type: "number" },
      { name: "deleted_at", type: "number", isOptional: true },
    ],
  }),
];
