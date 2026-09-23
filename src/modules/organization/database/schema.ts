import { tableSchema } from '@nozbe/watermelondb'

export const organizationSchema = [
  tableSchema({
    name: 'organization_roles',
    columns: [
      { name: 'organization_id', type: 'string', isIndexed: true },
      { name: 'name', type: 'string' },
      { name: 'created_at', type: 'number' },
      { name: 'updated_at', type: 'number' },
      { name: 'deleted_at', type: 'number', isOptional: true },
    ]
  }),
  tableSchema({
    name: 'organizations',
    columns: [
      { name: 'owner_id', type: 'string' },
      { name: 'name', type: 'string' },
      { name: 'created_at', type: 'number' },
      { name: 'updated_at', type: 'number' },
      { name: 'deleted_at', type: 'number', isOptional: true },
    ]
  }),
  // Note: 'organization_gradings' table moved to modules/grading/database/schema.ts
  // Note: 'schools' table moved to modules/school/database/schema.ts
  // Note: 'products' table moved to modules/inventory/database/schema.ts
  tableSchema({
    name: 'school_members',
    columns: [
      { name: 'school_id', type: 'string', isIndexed: true },
      { name: 'user_id', type: 'string', isOptional: true, isIndexed: true },
      { name: 'role_id', type: 'string', isOptional: true },
      { name: 'display_name', type: 'string', isOptional: true },
      { name: 'email', type: 'string', isOptional: true },
      { name: 'avatar_url', type: 'string', isOptional: true },
      { name: 'phone_number', type: 'string', isOptional: true },
      { name: 'status', type: 'string' },
      { name: 'current_rank_id', type: 'string', isOptional: true },
      { name: 'joined_at', type: 'number' },
      { name: 'created_at', type: 'number' },
      { name: 'updated_at', type: 'number' },
      { name: 'deleted_at', type: 'number', isOptional: true },
    ]
  }),
  tableSchema({
    name: 'orders',
    columns: [
      { name: 'school_id', type: 'string', isIndexed: true },
      { name: 'school_member_id', type: 'string', isIndexed: true },
      { name: 'status', type: 'string' },
      { name: 'created_at', type: 'number' },
      { name: 'updated_at', type: 'number' },
      { name: 'deleted_at', type: 'number', isOptional: true },
    ]
  }),
  tableSchema({
    name: 'order_items',
    columns: [
      { name: 'order_id', type: 'string', isIndexed: true },
      { name: 'product_variant_id', type: 'string', isIndexed: true },
      { name: 'quantity', type: 'number' },
      { name: 'unit_price', type: 'number' },
      { name: 'currency', type: 'string' },
      { name: 'created_at', type: 'number' },
      { name: 'updated_at', type: 'number' },
      { name: 'deleted_at', type: 'number', isOptional: true },
    ]
  }),
  tableSchema({
    name: 'payment_cycles',
    columns: [
      { name: 'school_id', type: 'string', isIndexed: true },
      { name: 'period_start', type: 'number' },
      { name: 'period_end', type: 'number' },
      { name: 'notes', type: 'string', isOptional: true },
      { name: 'created_at', type: 'number' },
      { name: 'updated_at', type: 'number' },
      { name: 'deleted_at', type: 'number', isOptional: true },
    ]
  }),
  tableSchema({
    name: 'payment_records',
    columns: [
      { name: 'payment_cycle_id', type: 'string', isIndexed: true },
      { name: 'school_member_id', type: 'string', isIndexed: true },
      { name: 'amount', type: 'number' },
      { name: 'currency', type: 'string' },
      { name: 'status', type: 'string' },
      { name: 'method', type: 'string' },
      { name: 'payment_date', type: 'number', isOptional: true },
      { name: 'created_at', type: 'number' },
      { name: 'updated_at', type: 'number' },
      { name: 'deleted_at', type: 'number', isOptional: true },
    ]
  }),
]
