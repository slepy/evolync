import { Model } from '@nozbe/watermelondb'
import { date, field, readonly, relation } from '@nozbe/watermelondb/decorators'
import type School from './School'

export default class SchoolSettings extends Model {
  static table = 'school_settings'
  static associations = {
    schools: { type: 'belongs_to' as const, key: 'school_id' },
  }

  @field('school_id') schoolId!: string
  @field('default_currency') defaultCurrency!: string
  @field('default_payment_amount') defaultPaymentAmount!: number

  @relation('schools', 'school_id') school!: School

  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date
  @date('deleted_at') deletedAt?: Date
}
