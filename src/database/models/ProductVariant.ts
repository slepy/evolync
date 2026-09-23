import { Model } from '@nozbe/watermelondb'
import { children, date, field, readonly, relation } from '@nozbe/watermelondb/decorators'
import type OrderItem from './OrderItem'
import type Product from './Product'

export default class ProductVariant extends Model {
  static table = 'product_variants'
  static associations = {
    products: { type: 'belongs_to' as const, key: 'product_id' },
    order_items: { type: 'has_many' as const, foreignKey: 'product_variant_id' },
  }

  @field('product_id') productId!: string
  @field('name') name!: string
  @field('price') price!: number
  @field('currency') currency!: string
  @field('stock_quantity') stockQuantity!: number

  @relation('products', 'product_id') product!: Product
  @children('order_items') orderItems!: OrderItem[]

  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date
  @date('deleted_at') deletedAt?: Date
}
