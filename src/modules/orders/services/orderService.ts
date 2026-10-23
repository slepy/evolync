import { database } from "@/database";
import type { Model } from "@nozbe/watermelondb";
import { EventParticipantRepository } from "@/modules/events/repositories";
import { sync } from "@/database/sync";
import { v4 as uuidv4 } from "uuid";
import type { CreateOrderItemDto, EventOrderChanges } from "../types/dto";
import { toOrderItemDto } from "../components/orderCart";
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
 * An order placed for an event must belong to one of its exam takers (10D
 * Add order, Q2): a non-deleted participant with Takes exam on.
 */
const assertEventExamTaker = async (eventId: string, memberId: string): Promise<void> => {
  const participant = await EventParticipantRepository.findByEventAndMember(eventId, memberId);
  if (!participant?.takesExam) {
    throw new Error("errorOrderEventNotAllowed");
  }
};

interface NewOrder {
  /** Default: a new UUID (an event order draft keeps its own). */
  id?: string;
  schoolId: string;
  memberId: string;
  items: CreateOrderItemDto[];
  eventId?: string;
  status?: Order["status"];
}

/** The order and its items as prepared creates for one `database.batch()`. */
const prepareOrderWithItems = (order: NewOrder): { order: Order; operations: Model[] } => {
  const ordersCollection = database.get<Order>("orders");
  const itemsCollection = database.get<OrderItem>("order_items");

  const newOrder = ordersCollection.prepareCreate((record) => {
    record._raw.id = order.id ?? uuidv4();
    record.schoolId = order.schoolId;
    record.schoolMemberId = order.memberId;
    record.status = order.status ?? OrderStatus.PLACED;
    if (order.eventId) record.eventId = order.eventId;
  });

  const itemOperations = order.items.map((item) =>
    itemsCollection.prepareCreate((record) => {
      record._raw.id = uuidv4();
      record.orderId = newOrder.id;
      record.productVariantId = item.variantId;
      record.quantity = item.quantity;
      record.unitPrice = item.unitPrice;
      record.currency = item.currency;
    }),
  );

  return { order: newOrder, operations: [newOrder, ...itemOperations] };
};

/**
 * Creates a new order with items in a single transaction.
 * Unit price and currency are stored as snapshots (historical preservation).
 *
 * @param schoolId - School ID
 * @param memberId - School member ID (the customer)
 * @param items - Array of order items with variant ID, quantity, unit price, currency
 * @param eventId - The event the order is placed for (an exam taker only)
 * @returns Created Order
 */
export const createOrderWithItems = async (
  schoolId: string,
  memberId: string,
  items: CreateOrderItemDto[],
  eventId?: string,
): Promise<Order> => {
  createOrderSchema.parse({ schoolId, schoolMemberId: memberId, items, eventId });
  if (eventId) await assertEventExamTaker(eventId, memberId);

  const { order, operations } = prepareOrderWithItems({ schoolId, memberId, items, eventId });
  await database.write(async () => {
    await database.batch(operations);
  });

  sync().catch((err) => {
    console.error("[createOrderWithItems] Sync failed:", err);
  });

  return order;
};

/**
 * Stores the unsaved order changes of an event's participants screen (10D
 * Save): the drafted orders (linked to the event, each checked for an exam
 * taker) and the status changes of stored orders, in one `database.batch()` —
 * all or nothing — then syncs. Until this runs nothing reaches the database
 * or Supabase.
 */
export const commitEventOrderChanges = async (eventId: string, changes: EventOrderChanges): Promise<void> => {
  const statusEntries = Object.entries(changes.statuses);
  if (changes.drafts.length === 0 && statusEntries.length === 0) return;

  const drafts = changes.drafts.map((draft) => ({
    id: draft.id,
    schoolId: draft.schoolId,
    memberId: draft.memberId,
    items: draft.items.map(toOrderItemDto),
    eventId,
    status: draft.status,
  }));
  for (const draft of drafts) {
    createOrderSchema.parse({ schoolId: draft.schoolId, schoolMemberId: draft.memberId, items: draft.items, eventId });
    await assertEventExamTaker(eventId, draft.memberId);
  }

  const ordersCollection = database.get<Order>("orders");
  const stored = await Promise.all(statusEntries.map(([orderId]) => ordersCollection.find(orderId)));
  const statusById = new Map(statusEntries);

  const operations: Model[] = [
    ...drafts.flatMap((draft) => prepareOrderWithItems(draft).operations),
    ...stored.map((order) =>
      order.prepareUpdate((r) => {
        r.status = statusById.get(r.id)!;
      }),
    ),
  ];

  await database.write(async () => {
    await database.batch(operations);
  });

  sync().catch((err) => {
    console.error("[commitEventOrderChanges] Sync failed:", err);
  });
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
