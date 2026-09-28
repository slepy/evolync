import { tableSchema } from "@nozbe/watermelondb";

/**
 * WatermelonDB schema for Orders module
 *
 * Two-table design:
 * - orders: one order placed by a school member
 * - order_items: line items on an order, with price/currency snapshotted at order time
 */
export const ordersSchema = [
  tableSchema({
    name: "orders",
    columns: [
      { name: "school_id", type: "string", isIndexed: true },
      { name: "school_member_id", type: "string", isIndexed: true },
      { name: "status", type: "string" },
      { name: "created_at", type: "number" },
      { name: "updated_at", type: "number" },
      { name: "deleted_at", type: "number", isOptional: true },
    ],
  }),
  tableSchema({
    name: "order_items",
    columns: [
      { name: "order_id", type: "string", isIndexed: true },
      { name: "product_variant_id", type: "string", isIndexed: true },
      { name: "quantity", type: "number" },
      { name: "unit_price", type: "number" },
      { name: "currency", type: "string" },
      { name: "created_at", type: "number" },
      { name: "updated_at", type: "number" },
      { name: "deleted_at", type: "number", isOptional: true },
    ],
  }),
];
