import { Model } from '@nozbe/watermelondb'
import { date, field, readonly, relation } from '@nozbe/watermelondb/decorators'
import type Organization from './Organization'

export default class GradingRank extends Model {
  static table = 'organization_gradings'
  static associations = {
    organizations: { type: 'belongs_to' as const, key: 'organization_id' },
  }

  @field('organization_id') organizationId!: string
  @field('name') name!: string
  @field('order') order!: number
  @field('color') color?: string

  @relation('organizations', 'organization_id') organization!: Organization

  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date
  @date('deleted_at') deletedAt?: Date
}
