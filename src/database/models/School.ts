import { Model } from '@nozbe/watermelondb'
import { date, field, readonly, relation } from '@nozbe/watermelondb/decorators'
import type Organization from './Organization'

export default class School extends Model {
  static table = 'schools'
  static associations = {
    organizations: { type: 'belongs_to' as const, key: 'organization_id' },
  }

  @field('organization_id') organizationId!: string
  @field('name') name!: string
  @field('address') address?: string

  @relation('organizations', 'organization_id') organization!: Organization

  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date
  @date('deleted_at') deletedAt?: Date
}
