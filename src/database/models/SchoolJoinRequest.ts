import { Model } from '@nozbe/watermelondb'
import { date, field, readonly } from '@nozbe/watermelondb/decorators'

export default class SchoolJoinRequest extends Model {
  static table = 'school_join_requests'
  static associations = {
    schools: { type: 'belongs_to' as const, key: 'school_id' },
  }

  @field('school_id') schoolId!: string
  @field('user_id') userId!: string
  @field('display_name') displayName!: string
  @field('email') email!: string
  @field('avatar_url') avatarUrl?: string
  @field('phone_number') phoneNumber?: string

  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date
  @date('deleted_at') deletedAt?: Date
}
