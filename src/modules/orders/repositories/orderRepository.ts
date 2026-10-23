import { database } from "@/database";
import Order from "@/database/models/Order";
import { Q } from "@nozbe/watermelondb";
import { v4 as uuidv4 } from "uuid";

export const OrderRepository = {
  async create(order: Partial<Order>): Promise<Order> {
    const ordersCollection = database.get<Order>("orders");
    return await database.write(async () => {
      return await ordersCollection.create((record) => {
        Object.assign(record, order);
        // Assign UUID for sync compatibility (Supabase expects UUID, not WatermelonDB base62 ID)
        (record._raw as any).id = uuidv4();
      });
    });
  },

  async findById(id: string): Promise<Order | null> {
    const ordersCollection = database.get<Order>("orders");
    try {
      return await ordersCollection.find(id);
    } catch {
      return null;
    }
  },

  async findBySchoolId(schoolId: string): Promise<Order[]> {
    const ordersCollection = database.get<Order>("orders");
    return await ordersCollection
      .query(
        Q.where("school_id", schoolId),
        Q.where("deleted_at", null),
        Q.sortBy("created_at", Q.desc)
      )
      .fetch();
  },

  async findByMemberId(memberId: string): Promise<Order[]> {
    const ordersCollection = database.get<Order>("orders");
    return await ordersCollection
      .query(
        Q.where("school_member_id", memberId),
        Q.where("deleted_at", null),
        Q.sortBy("created_at", Q.desc)
      )
      .fetch();
  },

  async update(id: string, data: Partial<Order>): Promise<Order> {
    const ordersCollection = database.get<Order>("orders");
    const order = await ordersCollection.find(id);
    return await database.write(async () => {
      return await order.update((record) => {
        Object.assign(record, data);
      });
    });
  },

  async softDelete(id: string): Promise<void> {
    const ordersCollection = database.get<Order>("orders");
    const order = await ordersCollection.find(id);
    await database.write(async () => {
      await order.update((record) => {
        record.deletedAt = new Date();
      });
    });
  },

  // Observable methods for reactive UI
  observeBySchoolId(schoolId: string) {
    const ordersCollection = database.get<Order>("orders");
    return ordersCollection
      .query(
        Q.where("school_id", schoolId),
        Q.where("deleted_at", null),
        Q.sortBy("created_at", Q.desc)
      )
      .observe();
  },

  observeByMemberId(memberId: string) {
    const ordersCollection = database.get<Order>("orders");
    return ordersCollection
      .query(
        Q.where("school_member_id", memberId),
        Q.where("deleted_at", null),
        Q.sortBy("created_at", Q.desc)
      )
      .observe();
  },

  observeById(id: string) {
    const ordersCollection = database.get<Order>("orders");
    return ordersCollection.findAndObserve(id);
  },

  // Observe all orders for schools in an organization
  observeBySchoolIds(schoolIds: string[]) {
    const ordersCollection = database.get<Order>("orders");
    return ordersCollection
      .query(
        Q.where("school_id", Q.oneOf(schoolIds)),
        Q.where("deleted_at", null),
        Q.sortBy("created_at", Q.desc)
      )
      .observe();
  },

  /** Orders of the schools for a list; re-emits on status changes too. */
  observeListBySchoolIds(schoolIds: string[]) {
    return database
      .get<Order>("orders")
      .query(
        Q.where("school_id", Q.oneOf(schoolIds)),
        Q.where("deleted_at", null),
        Q.sortBy("created_at", Q.desc)
      )
      .observeWithColumns(["status", "updated_at"]);
  },

  /** A member's orders for a list; re-emits on status changes too. */
  observeListByMemberId(memberId: string) {
    return database
      .get<Order>("orders")
      .query(
        Q.where("school_member_id", memberId),
        Q.where("deleted_at", null),
        Q.sortBy("created_at", Q.desc)
      )
      .observeWithColumns(["status", "updated_at"]);
  },

  /** Orders placed for an event (10D), newest first; re-emits on status changes too. */
  observeByEventId(eventId: string) {
    return database
      .get<Order>("orders")
      .query(
        Q.where("event_id", eventId),
        Q.where("deleted_at", null),
        Q.sortBy("created_at", Q.desc)
      )
      .observeWithColumns(["status", "updated_at"]);
  },

  observeCountBySchoolIds(schoolIds: string[], status: string) {
    const ordersCollection = database.get<Order>("orders");
    return ordersCollection
      .query(
        Q.where("school_id", Q.oneOf(schoolIds)),
        Q.where("status", status),
        Q.where("deleted_at", null)
      )
      .observeCount();
  },

  async findBySchoolIds(schoolIds: string[]): Promise<Order[]> {
    const ordersCollection = database.get<Order>("orders");
    return await ordersCollection
      .query(
        Q.where("school_id", Q.oneOf(schoolIds)),
        Q.where("deleted_at", null),
        Q.sortBy("created_at", Q.desc)
      )
      .fetch();
  },
};
