import { database } from "@/database";
import PaymentCycle from "@/database/models/PaymentCycle";
import { Q } from "@nozbe/watermelondb";
import { v4 as uuidv4 } from "uuid";

export const PaymentCycleRepository = {
  async create(data: Partial<PaymentCycle>): Promise<PaymentCycle> {
    const cyclesCollection = database.get<PaymentCycle>("payment_cycles");
    return await database.write(async () => {
      return await cyclesCollection.create((record) => {
        record._raw.id = data.id || uuidv4();
        Object.assign(record, data);
      });
    });
  },

  async findById(id: string): Promise<PaymentCycle | null> {
    const cyclesCollection = database.get<PaymentCycle>("payment_cycles");
    try {
      const cycle = await cyclesCollection.find(id);
      if (cycle.deletedAt) {
        return null;
      }
      return cycle;
    } catch {
      return null;
    }
  },

  async findBySchoolId(schoolId: string): Promise<PaymentCycle[]> {
    const cyclesCollection = database.get<PaymentCycle>("payment_cycles");
    return await cyclesCollection
      .query(
        Q.where("school_id", schoolId),
        Q.where("deleted_at", null),
        Q.sortBy("period_start", Q.desc)
      )
      .fetch();
  },

  async update(
    id: string,
    data: Partial<PaymentCycle>
  ): Promise<PaymentCycle> {
    const cyclesCollection = database.get<PaymentCycle>("payment_cycles");
    const cycle = await cyclesCollection.find(id);
    return await database.write(async () => {
      return await cycle.update((record) => {
        Object.assign(record, data);
      });
    });
  },

  async softDelete(id: string): Promise<void> {
    const cyclesCollection = database.get<PaymentCycle>("payment_cycles");
    const cycle = await cyclesCollection.find(id);
    await database.write(async () => {
      await cycle.update((record) => {
        record.deletedAt = new Date();
      });
    });
  },

  // Observable methods for reactive UI
  observeBySchoolId(schoolId: string) {
    const cyclesCollection = database.get<PaymentCycle>("payment_cycles");
    return cyclesCollection
      .query(
        Q.where("school_id", schoolId),
        Q.where("deleted_at", null),
        Q.sortBy("period_start", Q.desc)
      )
      .observe();
  },

  observeById(id: string) {
    const cyclesCollection = database.get<PaymentCycle>("payment_cycles");
    return cyclesCollection.findAndObserve(id);
  },

  async findByIds(ids: string[]): Promise<PaymentCycle[]> {
    if (ids.length === 0) return [];
    const cyclesCollection = database.get<PaymentCycle>("payment_cycles");
    return await cyclesCollection
      .query(Q.where("id", Q.oneOf(ids)))
      .fetch();
  },
};
