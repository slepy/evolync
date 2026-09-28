import { Model } from '@nozbe/watermelondb'
import { date, field, readonly } from '@nozbe/watermelondb/decorators'

export type JoinRequestStatus = 'pending' | 'rejected'

export const JoinRequestStatus = {
  PENDING: 'pending' as const,
  REJECTED: 'rejected' as const,
}

export const DEFAULT_JOIN_REQUEST_STATUS: JoinRequestStatus =
  JoinRequestStatus.PENDING

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
  @field('status') status?: JoinRequestStatus

  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date
  @date('deleted_at') deletedAt?: Date

  /** Existing rows migrated without a status column default to 'pending'. */
  get statusOrDefault(): JoinRequestStatus {
    return this.status ?? DEFAULT_JOIN_REQUEST_STATUS
  }
}
