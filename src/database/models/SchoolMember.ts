import { Model } from '@nozbe/watermelondb'
import { date, field, readonly, relation } from '@nozbe/watermelondb/decorators'
import type School from './School'
import type { MemberStatus } from '@/modules/students/types'

export default class SchoolMember extends Model {
  static table = 'school_members'
  static associations = {
    schools: { type: 'belongs_to' as const, key: 'school_id' },
  }

  @field('school_id') schoolId!: string
  @field('user_id') userId?: string
  @field('role_id') roleId?: string
  @field('display_name') displayName?: string
  @field('email') email?: string
  @field('avatar_url') avatarUrl?: string
  @field('phone_number') phoneNumber?: string
  @field('status') status!: MemberStatus
  @field('current_rank_id') currentRankId?: string

  @relation('schools', 'school_id') school!: School

  @readonly @date('joined_at') joinedAt!: Date
  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date
  @date('deleted_at') deletedAt?: Date
}
