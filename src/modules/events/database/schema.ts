import { tableSchema } from "@nozbe/watermelondb";

/**
 * WatermelonDB schema for Events module
 *
 * Two-table design:
 * - events: Main event records with visibility and lifecycle management
 * - event_participants: Participation status per member per event
 *   (also serves as whitelist for 'whitelist' visibility events)
 */
export const eventsSchema = [
  tableSchema({
    name: "events",
    columns: [
      { name: "organization_id", type: "string", isIndexed: true },
      { name: "school_id", type: "string", isOptional: true, isIndexed: true },
      { name: "name", type: "string" },
      { name: "short_note", type: "string", isOptional: true },
      { name: "address", type: "string", isOptional: true },
      { name: "start_date", type: "number" }, // Stored as timestamp
      { name: "end_date", type: "number" }, // Stored as timestamp
      { name: "price", type: "number" },
      { name: "currency", type: "string" },
      { name: "visibility", type: "string" }, // 'organization', 'school', 'whitelist'
      { name: "status", type: "string" }, // 'active', 'cancelled'
      { name: "created_by", type: "string" },
      { name: "created_at", type: "number" },
      { name: "updated_at", type: "number" },
      { name: "deleted_at", type: "number", isOptional: true },
    ],
  }),
  tableSchema({
    name: "event_participants",
    columns: [
      { name: "event_id", type: "string", isIndexed: true },
      { name: "school_member_id", type: "string", isIndexed: true },
      { name: "status", type: "string" }, // 'absent', 'attending', 'paid'
      { name: "status_changed_by", type: "string", isOptional: true },
      { name: "created_at", type: "number" },
      { name: "updated_at", type: "number" },
      { name: "deleted_at", type: "number", isOptional: true },
    ],
  }),
];
