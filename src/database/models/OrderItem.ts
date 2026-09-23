import { Model } from '@nozbe/watermelondb'
import { date, field, readonly, relation } from '@nozbe/watermelondb/decorators'
import type Order from './Order'
import type ProductVariant from './ProductVariant'

export default class OrderItem extends Model {
  static table = 'order_items'
  static associations = {
    orders: { type: 'belongs_to' as const, key: 'order_id' },
    product_variants: { type: 'belongs_to' as const, key: 'product_variant_id' },
  }

  @field('order_id') orderId!: string
  @field('product_variant_id') productVariantId!: string
  @field('quantity') quantity!: number
  @field('unit_price') unitPrice!: number
  @field('currency') currency!: string

  @relation('orders', 'order_id') order!: Order
  @relation('product_variants', 'product_variant_id') productVariant!: ProductVariant

  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date
  @date('deleted_at') deletedAt?: Date
}
