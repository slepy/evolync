import { Model } from "@nozbe/watermelondb";
import {
  date,
  field,
  readonly,
  relation,
} from "@nozbe/watermelondb/decorators";
import type PaymentCycle from "./PaymentCycle";
import type SchoolMember from "./SchoolMember";

export type PaymentStatus = "paid" | "pending" | "cancelled";
export type PaymentMethod = "cash" | "transfer" | "other";

export const PaymentStatus = {
  PAID: "paid" as const,
  PENDING: "pending" as const,
  CANCELLED: "cancelled" as const,
};

export const PaymentMethod = {
  CASH: "cash" as const,
  TRANSFER: "transfer" as const,
  OTHER: "other" as const,
};

/** Default status for new payment record */
export const DEFAULT_PAYMENT_STATUS: PaymentStatus = PaymentStatus.PENDING;

/** Default method for new payment record */
export const DEFAULT_PAYMENT_METHOD: PaymentMethod = PaymentMethod.CASH;

export default class PaymentRecord extends Model {
  static table = "payment_records";
  static associations = {
    payment_cycles: {
      type: "belongs_to" as const,
      key: "payment_cycle_id",
    },
    school_members: { type: "belongs_to" as const, key: "school_member_id" },
  };

  @field("payment_cycle_id") paymentCycleId!: string;
  @field("school_member_id") schoolMemberId!: string;
  @field("amount") amount!: number;
  @field("currency") currency!: string;
  @field("status") status!: PaymentStatus;
  @field("method") method!: PaymentMethod;

  @relation("payment_cycles", "payment_cycle_id") cycle!: PaymentCycle;
  @relation("school_members", "school_member_id") member!: SchoolMember;

  @date("payment_date") paymentDate?: Date;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
  @date("deleted_at") deletedAt?: Date;
}
