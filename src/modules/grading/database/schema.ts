import { tableSchema } from '@nozbe/watermelondb'

export const gradingSchema = [
  tableSchema({
    name: 'organization_gradings',
    columns: [
      { name: 'organization_id', type: 'string', isIndexed: true },
      { name: 'name', type: 'string' },
      { name: 'order', type: 'number' },
      { name: 'color', type: 'string', isOptional: true },
      { name: 'created_at', type: 'number' },
      { name: 'updated_at', type: 'number' },
      { name: 'deleted_at', type: 'number', isOptional: true },
    ]
  }),
]
