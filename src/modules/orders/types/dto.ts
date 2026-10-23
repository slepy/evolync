import type { OrderStatus } from "./enums";

export interface CreateOrderItemDto {
  variantId: string;
  quantity: number;
  unitPrice: number;
  currency: string;
}

export interface CreateOrderDto {
  schoolId: string;
  schoolMemberId: string;
  items: CreateOrderItemDto[];
}

/**
 * Cart item for local state in order forms (create and edit)
 * - For new items: id is a generated UUID, used later when creating OrderItem
 * - For existing items: id is the OrderItem ID from database
 */
export interface CartItem {
  id: string;
  variantId: string;
  variantName: string;
  productName: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  imageUrl?: string;
}

export interface StudentOption {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  rankId?: string;
}

/**
 * An order added from the participants screen (10D Add order) that is not
 * stored yet: it lives in memory until the participants Save (then it is
 * written to the database and synced), Back without Save drops it.
 */
export interface EventOrderDraft {
  /** Local id; becomes the order id when it is stored. */
  id: string;
  eventId: string;
  /** The member's own school (an organization event mixes schools). */
  schoolId: string;
  memberId: string;
  items: CartItem[];
  status: OrderStatus;
  createdAt: number;
}

/** Unsaved order changes of one event's participants screen. */
export interface EventOrderChanges {
  drafts: EventOrderDraft[];
  /** Stored order id → new status, applied on Save. */
  statuses: Record<string, OrderStatus>;
}

/** One order under a participant on 10D: a stored order or a draft. */
export interface EventOrderRowData {
  id: string;
  memberId: string;
  draft: boolean;
  /** Product name of a one-product order; otherwise null ("N items"). */
  productName: string | null;
  itemCount: number;
  totalsByCurrency: Record<string, number>;
  status: OrderStatus;
  /** The stored status (a draft order: its own status). */
  storedStatus: OrderStatus;
  createdAt: Date;
}
