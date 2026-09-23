import { tableSchema } from "@nozbe/watermelondb";

/**
 * WatermelonDB schema for School module
 * Defines local database structure for schools
 */
export const schoolSchema = [
  tableSchema({
    name: "schools",
    columns: [
      { name: "organization_id", type: "string", isIndexed: true },
      { name: "name", type: "string" },
      { name: "address", type: "string", isOptional: true },
      { name: "created_at", type: "number" },
      { name: "updated_at", type: "number" },
      { name: "deleted_at", type: "number", isOptional: true },
    ],
  }),
  tableSchema({
    name: "school_invites",
    columns: [
      { name: "school_id", type: "string", isIndexed: true },
      { name: "role_id", type: "string", isOptional: true },
      { name: "code", type: "string" },
      { name: "expires_at", type: "number" },
      { name: "created_by", type: "string" },
      { name: "created_at", type: "number" },
      { name: "updated_at", type: "number" },
      { name: "deleted_at", type: "number", isOptional: true },
    ],
  }),
  tableSchema({
    name: "school_join_requests",
    columns: [
      { name: "school_id", type: "string", isIndexed: true },
      { name: "user_id", type: "string", isIndexed: true },
      { name: "display_name", type: "string" },
      { name: "email", type: "string" },
      { name: "avatar_url", type: "string", isOptional: true },
      { name: "phone_number", type: "string", isOptional: true },
      { name: "created_at", type: "number" },
      { name: "updated_at", type: "number" },
      { name: "deleted_at", type: "number", isOptional: true },
    ],
  }),
  tableSchema({
    name: "school_settings",
    columns: [
      { name: "school_id", type: "string", isIndexed: true },
      { name: "default_currency", type: "string" },
      { name: "default_payment_amount", type: "number" },
      { name: "created_at", type: "number" },
      { name: "updated_at", type: "number" },
      { name: "deleted_at", type: "number", isOptional: true },
    ],
  }),
];
