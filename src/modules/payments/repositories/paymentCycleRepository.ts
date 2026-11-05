import { database } from "@/database";
import PaymentCycle from "@/database/models/PaymentCycle";
import PaymentRecord from "@/database/models/PaymentRecord";
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

  /** Lock (now) or unlock (null) a period. */
  async setLocked(id: string, locked: boolean): Promise<PaymentCycle> {
    const cycle = await database.get<PaymentCycle>("payment_cycles").find(id);
    return await database.write(async () =>
      cycle.update((record) => {
        record.lockedAt = locked ? new Date() : null;
      }),
    );
  },

  /**
   * Soft-deletes a period and all its records in one write. `guard` runs inside
   * the write with the period's live records and may throw to delete nothing.
   */
  async softDeleteWithRecords(id: string, guard?: (cycle: PaymentCycle, records: PaymentRecord[]) => void): Promise<number> {
    const cycle = await database.get<PaymentCycle>("payment_cycles").find(id);
    return await database.write(async () => {
      const records = await database
        .get<PaymentRecord>("payment_records")
        .query(Q.where("payment_cycle_id", id), Q.where("deleted_at", null))
        .fetch();
      guard?.(cycle, records);
      const now = new Date();
      await database.batch([
        cycle.prepareUpdate((record) => {
          record.deletedAt = now;
        }),
        ...records.map((record) =>
          record.prepareUpdate((r) => {
            r.deletedAt = now;
          }),
        ),
      ]);
      return records.length;
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
      // Re-emits when a period is locked / unlocked (14A badge, approve join list).
      .observeWithColumns(["locked_at"]);
  },

  observeById(id: string) {
    const cyclesCollection = database.get<PaymentCycle>("payment_cycles");
    return cyclesCollection.findAndObserve(id);
  },

  /** Periods by id, re-emitting when one is locked / unlocked (student details Payments tab). */
  observeByIds(ids: string[]) {
    return database
      .get<PaymentCycle>("payment_cycles")
      .query(Q.where("id", Q.oneOf(ids)), Q.where("deleted_at", null))
      .observeWithColumns(["locked_at"]);
  },

  async findByIds(ids: string[]): Promise<PaymentCycle[]> {
    if (ids.length === 0) return [];
    const cyclesCollection = database.get<PaymentCycle>("payment_cycles");
    return await cyclesCollection
      .query(Q.where("id", Q.oneOf(ids)))
      .fetch();
  },
};
