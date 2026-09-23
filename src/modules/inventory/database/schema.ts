import { tableSchema } from '@nozbe/watermelondb';

/**
 * WatermelonDB schema for Inventory module
 * Defines local database structure for products
 */
export const productSchema = [
  tableSchema({
    name: 'products',
    columns: [
      { name: 'organization_id', type: 'string', isIndexed: true },
      { name: 'name', type: 'string' },
      { name: 'description', type: 'string', isOptional: true },
      { name: 'image_url', type: 'string', isOptional: true },
      { name: 'created_at', type: 'number' },
      { name: 'updated_at', type: 'number' },
      { name: 'deleted_at', type: 'number', isOptional: true },
    ],
  }),
  tableSchema({
    name: 'product_variants',
    columns: [
      { name: 'product_id', type: 'string', isIndexed: true },
      { name: 'name', type: 'string' },
      { name: 'price', type: 'number' },
      { name: 'currency', type: 'string' },
      { name: 'stock_quantity', type: 'number' },
      { name: 'created_at', type: 'number' },
      { name: 'updated_at', type: 'number' },
      { name: 'deleted_at', type: 'number', isOptional: true },
    ],
  }),
];
