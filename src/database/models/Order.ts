import { Model } from "@nozbe/watermelondb";
import {
  children,
  date,
  field,
  readonly,
  relation,
} from "@nozbe/watermelondb/decorators";
import type OrderItem from "./OrderItem";
import type School from "./School";
import type SchoolMember from "./SchoolMember";
import type { OrderStatus } from "@/modules/orders/types";

export default class Order extends Model {
  static table = "orders";
  static associations = {
    schools: { type: "belongs_to" as const, key: "school_id" },
    school_members: { type: "belongs_to" as const, key: "school_member_id" },
    order_items: { type: "has_many" as const, foreignKey: "order_id" },
    events: { type: "belongs_to" as const, key: "event_id" },
  };

  @field("school_id") schoolId!: string;
  @field("school_member_id") schoolMemberId!: string;
  @field("status") status!: OrderStatus;
  /** The event the order was placed for (set at creation from 10D, never changed). */
  @field("event_id") eventId?: string;

  @relation("schools", "school_id") school!: School;
  @relation("school_members", "school_member_id") schoolMember!: SchoolMember;
  @children("order_items") orderItems!: OrderItem[];

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
  @date("deleted_at") deletedAt?: Date;
}
