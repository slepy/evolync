import { database } from "@/database";
import { sync } from "@/database/sync";
import { v4 as uuidv4 } from "uuid";
import type { CreateOrderItemDto } from "../types/dto";
import { OrderStatus } from "../types";
import { OrderRepository } from "../repositories/orderRepository";
import { OrderItemRepository } from "../repositories/orderItemRepository";
import type Order from "@/database/models/Order";
import type OrderItem from "@/database/models/OrderItem";
import { createOrderSchema } from "../validation";

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
  createOrderSchema.parse({ schoolId, schoolMemberId: memberId, items });

  const order = await database.write(async () => {
    const ordersCollection = database.get<Order>("orders");
    const itemsCollection = database.get<OrderItem>("order_items");

    const newOrder = await ordersCollection.create((record) => {
      record._raw.id = uuidv4();
      record.schoolId = schoolId;
      record.schoolMemberId = memberId;
      record.status = OrderStatus.PLACED;
    });

    const itemOperations = items.map((item) =>
      itemsCollection.prepareCreate((record) => {
        record._raw.id = uuidv4();
        record.orderId = newOrder.id;
        record.productVariantId = item.variantId;
        record.quantity = item.quantity;
        record.unitPrice = item.unitPrice;
        record.currency = item.currency;
      }),
    );

    if (itemOperations.length > 0) {
      await database.batch(itemOperations);
    }

    return newOrder;
  });

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
  const updated = await OrderRepository.update(orderId, { status });
  sync().catch((err) => {
    console.error("[updateOrderStatus] Sync failed:", err);
  });
  return updated;
};

/**
 * Removes order items by their IDs (soft delete)
 *
 * Atomic: all items commit in a single database.batch(), or none do.
 */
export const removeOrderItems = async (itemIds: string[]): Promise<void> => {
  if (itemIds.length === 0) return;

  const collection = database.get<OrderItem>("order_items");
  const items = await Promise.all(itemIds.map((id) => collection.find(id)));
  const operations = items.map((item) =>
    item.prepareUpdate((r) => {
      r.deletedAt = new Date();
    }),
  );

  await database.write(async () => {
    await database.batch(operations);
  });

  sync().catch((err) => {
    console.error("[removeOrderItems] Sync failed:", err);
  });
};

/**
 * Adds new items to an existing order
 *
 * Atomic: all items commit in a single database.batch(), or none do.
 */
export const addOrderItems = async (
  orderId: string,
  items: CreateOrderItemDto[],
): Promise<void> => {
  if (items.length === 0) return;

  const collection = database.get<OrderItem>("order_items");
  const operations = items.map((item) =>
    collection.prepareCreate((record) => {
      record._raw.id = uuidv4();
      record.orderId = orderId;
      record.productVariantId = item.variantId;
      record.quantity = item.quantity;
      record.unitPrice = item.unitPrice;
      record.currency = item.currency;
    }),
  );

  await database.write(async () => {
    await database.batch(operations);
  });

  sync().catch((err) => {
    console.error("[addOrderItems] Sync failed:", err);
  });
};

/**
 * Updates quantities for existing order items
 *
 * Atomic: all items commit in a single database.batch(), or none do.
 */
export const updateOrderItemQuantities = async (
  updates: Array<{ itemId: string; quantity: number }>,
): Promise<void> => {
  if (updates.length === 0) return;

  const collection = database.get<OrderItem>("order_items");
  const items = await Promise.all(
    updates.map((u) => collection.find(u.itemId)),
  );
  const quantityByItemId = new Map(updates.map((u) => [u.itemId, u.quantity]));
  const operations = items.map((item) =>
    item.prepareUpdate((r) => {
      r.quantity = quantityByItemId.get(r.id)!;
    }),
  );

  await database.write(async () => {
    await database.batch(operations);
  });

  sync().catch((err) => {
    console.error("[updateOrderItemQuantities] Sync failed:", err);
  });
};

/**
 * Combined item update — remove some items, adjust quantities on others, and
 * add new ones, all in a single database.batch() so a save either fully
 * commits or fully fails (used by the order-detail "Save" flow).
 */
export const updateOrderItems = async (
  orderId: string,
  itemIdsToRemove: string[],
  itemsToAdd: CreateOrderItemDto[],
  quantityUpdates: Array<{ itemId: string; quantity: number }> = [],
): Promise<void> => {
  if (
    itemIdsToRemove.length === 0 &&
    itemsToAdd.length === 0 &&
    quantityUpdates.length === 0
  ) {
    return;
  }

  const collection = database.get<OrderItem>("order_items");
  const quantityByItemId = new Map(
    quantityUpdates.map((u) => [u.itemId, u.quantity]),
  );

  const [itemsToRemove, itemsToUpdate] = await Promise.all([
    Promise.all(itemIdsToRemove.map((id) => collection.find(id))),
    Promise.all(quantityUpdates.map((u) => collection.find(u.itemId))),
  ]);

  const operations = [
    ...itemsToRemove.map((item) =>
      item.prepareUpdate((r) => {
        r.deletedAt = new Date();
      }),
    ),
    ...itemsToUpdate.map((item) =>
      item.prepareUpdate((r) => {
        r.quantity = quantityByItemId.get(r.id)!;
      }),
    ),
    ...itemsToAdd.map((item) =>
      collection.prepareCreate((record) => {
        record._raw.id = uuidv4();
        record.orderId = orderId;
        record.productVariantId = item.variantId;
        record.quantity = item.quantity;
        record.unitPrice = item.unitPrice;
        record.currency = item.currency;
      }),
    ),
  ];

  await database.write(async () => {
    await database.batch(operations);
  });

  sync().catch((err) => {
    console.error("[updateOrderItems] Sync failed:", err);
  });
};

/**
 * Soft deletes an order and its items
 *
 * Atomic: all items and the order commit in a single database.batch(), or none do.
 */
export const deleteOrder = async (orderId: string): Promise<void> => {
  const items = await OrderItemRepository.findByOrderId(orderId);
  const orderCollection = database.get<Order>("orders");
  const order = await orderCollection.find(orderId);

  const now = new Date();
  const operations = [
    ...items.map((item) =>
      item.prepareUpdate((r) => {
        r.deletedAt = now;
      }),
    ),
    order.prepareUpdate((r) => {
      r.deletedAt = now;
    }),
  ];

  await database.write(async () => {
    await database.batch(operations);
  });

  sync().catch((err) => {
    console.error("[deleteOrder] Sync failed:", err);
  });
};
