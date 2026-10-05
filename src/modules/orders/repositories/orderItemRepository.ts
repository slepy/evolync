import { database } from "@/database";
import OrderItem from "@/database/models/OrderItem";
import { Q } from "@nozbe/watermelondb";
import { v4 as uuidv4 } from "uuid";

export const OrderItemRepository = {
  async create(item: Partial<OrderItem>): Promise<OrderItem> {
    const orderItemsCollection = database.get<OrderItem>("order_items");
    return await database.write(async () => {
      return await orderItemsCollection.create((record) => {
        Object.assign(record, item);
        // Assign UUID for sync compatibility (Supabase expects UUID, not WatermelonDB base62 ID)
        (record._raw as any).id = uuidv4();
      });
    });
  },

  async findById(id: string): Promise<OrderItem | null> {
    const orderItemsCollection = database.get<OrderItem>("order_items");
    try {
      const item = await orderItemsCollection.find(id);
      if (item.deletedAt) return null;
      return item;
    } catch {
      return null;
    }
  },

  async findByOrderId(orderId: string): Promise<OrderItem[]> {
    const orderItemsCollection = database.get<OrderItem>("order_items");
    return await orderItemsCollection
      .query(Q.where("order_id", orderId), Q.where("deleted_at", null))
      .fetch();
  },

  async update(id: string, data: Partial<OrderItem>): Promise<OrderItem> {
    const orderItemsCollection = database.get<OrderItem>("order_items");
    const item = await orderItemsCollection.find(id);
    return await database.write(async () => {
      return await item.update((record) => {
        Object.assign(record, data);
      });
    });
  },

  async softDelete(id: string): Promise<void> {
    const orderItemsCollection = database.get<OrderItem>("order_items");
    const item = await orderItemsCollection.find(id);
    await database.write(async () => {
      await item.update((record) => {
        record.deletedAt = new Date();
      });
    });
  },

  async countByVariantIds(variantIds: string[]): Promise<number> {
    if (variantIds.length === 0) return 0;
    const orderItemsCollection = database.get<OrderItem>("order_items");
    return await orderItemsCollection
      .query(
        Q.where("product_variant_id", Q.oneOf(variantIds)),
        Q.where("deleted_at", null),
      )
      .fetchCount();
  },

  // Observable methods for reactive UI
  observeByOrderId(orderId: string) {
    const orderItemsCollection = database.get<OrderItem>("order_items");
    return orderItemsCollection
      .query(Q.where("order_id", orderId), Q.where("deleted_at", null))
      .observe();
  },

  /** Items of several orders (list totals, shopping list); re-emits on quantity changes. */
  observeByOrderIds(orderIds: string[]) {
    const orderItemsCollection = database.get<OrderItem>("order_items");
    return orderItemsCollection
      .query(Q.where("order_id", Q.oneOf(orderIds)), Q.where("deleted_at", null))
      .observeWithColumns(["quantity"]);
  },
};
