import { Model } from "@nozbe/watermelondb";
import {
  children,
  date,
  field,
  readonly,
  relation,
} from "@nozbe/watermelondb/decorators";
import type PaymentRecord from "./PaymentRecord";
import type School from "./School";

export default class PaymentCycle extends Model {
  static table = "payment_cycles";
  static associations = {
    schools: { type: "belongs_to" as const, key: "school_id" },
    payment_records: {
      type: "has_many" as const,
      foreignKey: "payment_cycle_id",
    },
  };

  @field("school_id") schoolId!: string;
  @date("period_start") periodStart!: Date;
  @date("period_end") periodEnd!: Date;
  @field("notes") notes?: string;
  /** One-off amount for everyone in this period; null = each member's own fee or the school default. */
  @field("amount") amount?: number | null;
  @field("currency") currency?: string | null;

  @relation("schools", "school_id") school!: School;
  @children("payment_records") records!: PaymentRecord[];

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
  @date("deleted_at") deletedAt?: Date;
}
