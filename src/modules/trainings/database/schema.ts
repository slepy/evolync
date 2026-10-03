import { tableSchema } from "@nozbe/watermelondb";

/**
 * WatermelonDB schema for the Trainings module (planned trainings).
 *
 * Three-table design, fully separate from attendance's training_sessions:
 * - trainings: one row per concrete training on one day (what lists read)
 * - training_series: a recurring definition whose occurrences are
 *   materialized as trainings rows (linked by series_id) at save time
 * - training_invitees: selected people for 'whitelist' trainings
 */
export const trainingsSchema = [
  tableSchema({
    name: "trainings",
    columns: [
      { name: "organization_id", type: "string", isIndexed: true },
      { name: "school_id", type: "string", isOptional: true, isIndexed: true },
      { name: "series_id", type: "string", isOptional: true, isIndexed: true },
      { name: "name", type: "string" },
      { name: "date", type: "number", isIndexed: true }, // UTC-midnight timestamp of the day
      { name: "start_time", type: "string" }, // "HH:mm" wall-clock
      { name: "end_time", type: "string" }, // "HH:mm" wall-clock
      { name: "location", type: "string", isOptional: true },
      { name: "visibility", type: "string" }, // 'organization', 'school', 'whitelist'
      { name: "status", type: "string" }, // 'active', 'cancelled'
      { name: "created_by", type: "string" },
      { name: "created_at", type: "number" },
      { name: "updated_at", type: "number" },
      { name: "deleted_at", type: "number", isOptional: true },
    ],
  }),
  tableSchema({
    name: "training_series",
    columns: [
      { name: "organization_id", type: "string", isIndexed: true },
      { name: "school_id", type: "string", isOptional: true, isIndexed: true },
      { name: "name", type: "string" },
      { name: "location", type: "string", isOptional: true },
      { name: "visibility", type: "string" },
      { name: "invitee_ids", type: "string" }, // JSON string array of school_member ids
      { name: "start_date", type: "number" }, // UTC-midnight timestamp
      { name: "end_date", type: "number" }, // UTC-midnight timestamp
      { name: "rules", type: "string" }, // JSON string of SeriesRule[]
      { name: "created_by", type: "string" },
      { name: "created_at", type: "number" },
      { name: "updated_at", type: "number" },
      { name: "deleted_at", type: "number", isOptional: true },
    ],
  }),
  tableSchema({
    name: "training_invitees",
    columns: [
      { name: "training_id", type: "string", isIndexed: true },
      { name: "school_member_id", type: "string", isIndexed: true },
      { name: "created_at", type: "number" },
      { name: "updated_at", type: "number" },
      { name: "deleted_at", type: "number", isOptional: true },
    ],
  }),
];
