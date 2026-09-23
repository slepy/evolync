import type { Query } from '@nozbe/watermelondb'
import { Model } from '@nozbe/watermelondb'
import { children, date, field, readonly, relation } from '@nozbe/watermelondb/decorators'
import type Organization from './Organization'
import type ProductVariant from './ProductVariant'

export default class Product extends Model {
  static table = 'products'
  static associations = {
    organizations: { type: 'belongs_to' as const, key: 'organization_id' },
    product_variants: { type: 'has_many' as const, foreignKey: 'product_id' },
  }

  @field('organization_id') organizationId!: string
  @field('name') name!: string
  @field('description') description?: string
  @field('image_url') imageUrl?: string

  @relation('organizations', 'organization_id') organization!: Organization
  @children('product_variants') variants!: Query<ProductVariant>

  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date
  @date('deleted_at') deletedAt?: Date
}
