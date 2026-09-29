import { database } from "@/database";
import PaymentRecord from "@/database/models/PaymentRecord";
import { Q } from "@nozbe/watermelondb";
import { v4 as uuidv4 } from "uuid";

export const PaymentRecordRepository = {
  async create(data: Partial<PaymentRecord>): Promise<PaymentRecord> {
    const recordsCollection = database.get<PaymentRecord>("payment_records");
    return await database.write(async () => {
      return await recordsCollection.create((record) => {
        record._raw.id = data.id || uuidv4();
        Object.assign(record, data);
      });
    });
  },

  async findById(id: string): Promise<PaymentRecord | null> {
    const recordsCollection = database.get<PaymentRecord>("payment_records");
    try {
      const record = await recordsCollection.find(id);
      if (record.deletedAt) {
        return null;
      }
      return record;
    } catch {
      return null;
    }
  },

  async findByCycleId(cycleId: string): Promise<PaymentRecord[]> {
    const recordsCollection = database.get<PaymentRecord>("payment_records");
    return await recordsCollection
      .query(
        Q.where("payment_cycle_id", cycleId),
        Q.where("deleted_at", null)
      )
      .fetch();
  },

  async findByCycleAndMember(
    cycleId: string,
    memberId: string
  ): Promise<PaymentRecord | null> {
    const recordsCollection = database.get<PaymentRecord>("payment_records");
    const records = await recordsCollection
      .query(
        Q.where("payment_cycle_id", cycleId),
        Q.where("school_member_id", memberId),
        Q.where("deleted_at", null)
      )
      .fetch();
    return records.length > 0 ? records[0] : null;
  },

  async update(
    id: string,
    data: Partial<PaymentRecord>
  ): Promise<PaymentRecord> {
    const recordsCollection = database.get<PaymentRecord>("payment_records");
    const record = await recordsCollection.find(id);
    return await database.write(async () => {
      return await record.update((r) => {
        Object.assign(r, data);
      });
    });
  },

  async softDelete(id: string): Promise<void> {
    const recordsCollection = database.get<PaymentRecord>("payment_records");
    const record = await recordsCollection.find(id);
    await database.write(async () => {
      await record.update((r) => {
        r.deletedAt = new Date();
      });
    });
  },

  async bulkCreate(
    cycleId: string,
    memberIds: string[],
    defaultAmount: number,
    defaultCurrency: string
  ): Promise<void> {
    const recordsCollection = database.get<PaymentRecord>("payment_records");
    await database.write(async () => {
      const operations = memberIds.map((memberId) =>
        recordsCollection.prepareCreate((record) => {
          record._raw.id = uuidv4();
          record.paymentCycleId = cycleId;
          record.schoolMemberId = memberId;
          record.amount = defaultAmount;
          record.currency = defaultCurrency;
          record.status = "pending";
          record.method = "cash";
        })
      );
      if (operations.length > 0) {
        await database.batch(operations);
      }
    });
  },

  async softDeleteByCycleId(cycleId: string): Promise<void> {
    const recordsCollection = database.get<PaymentRecord>("payment_records");
    const records = await recordsCollection
      .query(Q.where("payment_cycle_id", cycleId))
      .fetch();

    await database.write(async () => {
      const operations = records.map((record) =>
        record.prepareUpdate((r) => {
          r.deletedAt = new Date();
        })
      );
      if (operations.length > 0) {
        await database.batch(operations);
      }
    });
  },

  // Observable methods for reactive UI
  observeByCycleId(cycleId: string) {
    const recordsCollection = database.get<PaymentRecord>("payment_records");
    return recordsCollection
      .query(
        Q.where("payment_cycle_id", cycleId),
        Q.where("deleted_at", null)
      )
      .observe();
  },

  observeByMemberId(memberId: string) {
    const recordsCollection = database.get<PaymentRecord>("payment_records");
    return recordsCollection
      .query(
        Q.where("school_member_id", memberId),
        Q.where("deleted_at", null)
      )
      .observe();
  },

  async findByMemberId(memberId: string): Promise<PaymentRecord[]> {
    const recordsCollection = database.get<PaymentRecord>("payment_records");
    return await recordsCollection
      .query(
        Q.where("school_member_id", memberId),
        Q.where("deleted_at", null)
      )
      .fetch();
  },

  observeByCycleIds(cycleIds: string[]) {
    const recordsCollection = database.get<PaymentRecord>("payment_records");
    return recordsCollection
      .query(
        Q.where("payment_cycle_id", Q.oneOf(cycleIds)),
        Q.where("deleted_at", null)
      )
      .observe();
  },

  async findByCycleIds(cycleIds: string[]): Promise<PaymentRecord[]> {
    if (cycleIds.length === 0) return [];
    const recordsCollection = database.get<PaymentRecord>("payment_records");
    return await recordsCollection
      .query(
        Q.where("payment_cycle_id", Q.oneOf(cycleIds)),
        Q.where("deleted_at", null)
      )
      .fetch();
  },

  observeBySchoolId(schoolId: string) {
    const recordsCollection = database.get<PaymentRecord>("payment_records");
    return recordsCollection
      .query(
        Q.on("payment_cycles", [
          Q.where("school_id", schoolId),
          Q.where("deleted_at", null),
        ]),
        Q.where("deleted_at", null)
      )
      .observe();
  },
};
