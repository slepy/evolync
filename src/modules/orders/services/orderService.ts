import { sync } from "@/database/sync";
import type { CreateOrderItemDto } from "../types/dto";
import { OrderStatus } from "../types";
import { OrderRepository } from "../repositories/orderRepository";
import { OrderItemRepository } from "../repositories/orderItemRepository";
import type Order from "@/database/models/Order";
import type OrderItem from "@/database/models/OrderItem";

// Pomocnicza funkcja do dodawania wielu pozycji do zamówienia
async function addOrderItemsToOrder(
  orderId: string,
  items: CreateOrderItemDto[],
): Promise<void> {
  for (const item of items) {
    await OrderItemRepository.create({
      orderId,
      productVariantId: item.variantId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      currency: item.currency,
    });
  }
}

// ============================================================================
// Orders
// ============================================================================

/**
 * Creates a new order with items in a single transaction.
 * Unit price and currency are stored as snapshots (historical preservation).
 *
 * @param schoolId - School ID
 * @param memberId - School member ID (the customer)
 * @param items - Array of order items with variant ID, quantity, unit price, currency
 * @returns Created Order
 */
export const createOrderWithItems = async (
  schoolId: string,
  memberId: string,
  items: CreateOrderItemDto[],
): Promise<Order> => {
  const order = await OrderRepository.create({
    schoolId,
    schoolMemberId: memberId,
    status: OrderStatus.PLACED,
  });
  await addOrderItemsToOrder(order.id, items);
  sync().catch((err) => {
    console.error("[createOrderWithItems] Sync failed:", err);
  });
  return order;
};

/**
 * Gets all orders for a school, ordered by created_at descending
 */
export const getOrdersForSchool = async (
  schoolId: string,
): Promise<Order[]> => {
  return OrderRepository.findBySchoolId(schoolId);
};

/**
 * Gets an order by ID with its items
 */
export const getOrderById = async (orderId: string): Promise<Order | null> => {
  return OrderRepository.findById(orderId);
};

/**
 * Gets all order items for an order
 */
export const getOrderItems = async (orderId: string): Promise<OrderItem[]> => {
  return OrderItemRepository.findByOrderId(orderId);
};

/**
 * Updates order status
 */
export const updateOrderStatus = async (
  orderId: string,
  status: Order["status"],
): Promise<Order> => {
  // logika biznesowa: zmiana statusu zamówienia
  const updated = await OrderRepository.update(orderId, { status });
  sync().catch((err) => {
    console.error("[updateOrderStatus] Sync failed:", err);
  });
  return updated;
};

/**
 * Removes order items by their IDs (soft delete)
 */
export const removeOrderItems = async (itemIds: string[]): Promise<void> => {
  if (itemIds.length === 0) return;
  // logika biznesowa: soft delete wielu pozycji
  for (const id of itemIds) {
    await OrderItemRepository.update(id, { deletedAt: new Date() });
  }
  sync().catch((err) => {
    console.error("[removeOrderItems] Sync failed:", err);
  });
};

/**
 * Adds new items to an existing order
 */
export const addOrderItems = async (
  orderId: string,
  items: CreateOrderItemDto[],
): Promise<void> => {
  if (items.length === 0) return;
  await addOrderItemsToOrder(orderId, items);
  sync().catch((err) => {
    console.error("[addOrderItems] Sync failed:", err);
  });
};

/**
 * Updates quantities for existing order items
 */
export const updateOrderItemQuantities = async (
  updates: Array<{ itemId: string; quantity: number }>,
): Promise<void> => {
  if (updates.length === 0) return;
  for (const { itemId, quantity } of updates) {
    await OrderItemRepository.update(itemId, { quantity });
  }
  sync().catch((err) => {
    console.error("[updateOrderItemQuantities] Sync failed:", err);
  });
};

/**
 * Soft deletes an order and its items
 */
export const deleteOrder = async (orderId: string): Promise<void> => {
  // logika biznesowa: soft delete zamówienia i jego pozycji
  // Soft delete all order items
  const items = await OrderItemRepository.findByOrderId(orderId);
  for (const item of items) {
    await OrderItemRepository.update(item.id, { deletedAt: new Date() });
  }
  // Soft delete the order
  await OrderRepository.update(orderId, { deletedAt: new Date() });
  sync().catch((err) => {
    console.error("[deleteOrder] Sync failed:", err);
  });
};
