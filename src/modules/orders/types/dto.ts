import { SchoolMember } from "@/database/models";
import type Order from "@/database/models/Order";

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

export interface OrderWithDetails {
  orderId: string;
  schoolId: string;
  schoolName?: string;
  status: Order["status"];
  createdAt: Date;
  member: SchoolMember | null;
  itemCount: number;
  totalsByCurrency: Record<string, number>;
}

export interface AggregatedProduct {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  imageUrl: string | null;
  totalQuantity: number;
  currency: string;
  unitPrice: number;
}
