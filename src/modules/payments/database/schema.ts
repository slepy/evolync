import { tableSchema } from "@nozbe/watermelondb";

/**
 * WatermelonDB schema for Payments module
 *
 * Two-table design:
 * - payment_cycles: A billing period for a school (e.g. "January 2026")
 * - payment_records: Individual payment status per member per cycle
 */
export const paymentsSchema = [
  tableSchema({
    name: "payment_cycles",
    columns: [
      { name: "school_id", type: "string", isIndexed: true },
      { name: "period_start", type: "number" },
      { name: "period_end", type: "number" },
      { name: "notes", type: "string", isOptional: true },
      { name: "locked_at", type: "number", isOptional: true }, // null = unlocked
      { name: "created_at", type: "number" },
      { name: "updated_at", type: "number" },
      { name: "deleted_at", type: "number", isOptional: true },
    ],
  }),
  tableSchema({
    name: "payment_records",
    columns: [
      { name: "payment_cycle_id", type: "string", isIndexed: true },
      { name: "school_member_id", type: "string", isIndexed: true },
      { name: "amount", type: "number" },
      { name: "currency", type: "string" },
      { name: "status", type: "string" }, // 'paid', 'pending', 'cancelled'
      { name: "method", type: "string" }, // 'cash', 'transfer', 'other'
      { name: "payment_date", type: "number", isOptional: true },
      { name: "created_at", type: "number" },
      { name: "updated_at", type: "number" },
      { name: "deleted_at", type: "number", isOptional: true },
    ],
  }),
];
