import { database } from "@/database";
import PaymentCycle from "@/database/models/PaymentCycle";
import PaymentRecord, {
  type PaymentMethod,
} from "@/database/models/PaymentRecord";
import SchoolMember from "@/database/models/SchoolMember";
import SchoolSettings from "@/database/models/SchoolSettings";
import { sync } from "@/database/sync";
import { Q } from "@nozbe/watermelondb";
import { v4 as uuidv4 } from "uuid";

import type {
  CreatePaymentCycleDto,
  UpsertPaymentRecordDto,
} from "../types/dto";
import {
  PaymentCycleRepository,
  PaymentRecordRepository,
} from "../repositories";
import { MemberStatus } from "@/modules/students/types";
import {
  createPaymentCycleSchema,
  paymentRecordEditSchema,
} from "../validation";

// ============================================================================
// Payment Cycles
// ============================================================================

/**
 * Creates a new payment cycle for a school and automatically creates
 * payment records for all active members with default values from school settings.
 *
 * @param data - Cycle data (schoolId, periodStart, periodEnd, notes)
 * @returns Created PaymentCycle
 * @throws Error if a cycle with the same period already exists
 */
export const createPaymentCycle = async (
  data: CreatePaymentCycleDto,
): Promise<PaymentCycle> => {
  createPaymentCycleSchema.parse(data);

  // Check for existing cycle with same period
  const existingCycles = await PaymentCycleRepository.findBySchoolId(
    data.schoolId,
  );

  // Check if any existing cycle has the same period dates
  const periodStartDate = new Date(data.periodStart)
    .toISOString()
    .split("T")[0];
  const periodEndDate = new Date(data.periodEnd).toISOString().split("T")[0];

  const duplicateCycle = existingCycles.find((cycle) => {
    const cycleStart = cycle.periodStart.toISOString().split("T")[0];
    const cycleEnd = cycle.periodEnd.toISOString().split("T")[0];
    return cycleStart === periodStartDate && cycleEnd === periodEndDate;
  });

  if (duplicateCycle) {
    throw new Error(t("errorDuplicatePeriod"));
  }

  const cycleId = uuidv4();

  // Get school settings for defaults
  const settingsCollection = database.get<SchoolSettings>("school_settings");
  const settings = await settingsCollection
    .query(Q.where("school_id", data.schoolId), Q.where("deleted_at", null))
    .fetch();

  const defaultCurrency = settings[0]?.defaultCurrency ?? "PLN";
  const defaultAmount = settings[0]?.defaultPaymentAmount ?? 0;

  // Get all active members of the school
  const membersCollection = database.get<SchoolMember>("school_members");
  const activeMembers = await membersCollection
    .query(
      Q.where("school_id", data.schoolId),
      Q.where("status", Q.oneOf([MemberStatus.ACTIVE, MemberStatus.OFFLINE])),
      Q.where("deleted_at", null),
    )
    .fetch();

  // Create cycle and payment records in a single transaction
  const cycle = await database.write(async () => {
    const cyclesCollection = database.get<PaymentCycle>("payment_cycles");
    const recordsCollection = database.get<PaymentRecord>("payment_records");

    // Create the payment cycle
    const newCycle = await cyclesCollection.create((record) => {
      record._raw.id = cycleId;
      record.schoolId = data.schoolId;
      record.periodStart = new Date(data.periodStart);
      record.periodEnd = new Date(data.periodEnd);
      if (data.notes) {
        record.notes = data.notes;
      }
    });

    // Create payment records for all active members
    if (activeMembers.length > 0) {
      const recordOperations = activeMembers.map((member) => {
        const recordId = uuidv4();
        return recordsCollection.prepareCreate((r) => {
          r._raw.id = recordId;
          r.paymentCycleId = cycleId;
          r.schoolMemberId = member.id;
          r.amount = defaultAmount;
          r.currency = defaultCurrency;
          r.status = "pending";
          r.method = "cash";
        });
      });

      await database.batch(recordOperations);
    }

    return newCycle;
  });

  // Trigger background sync
  sync().catch((err) => {
    console.error("[createPaymentCycle] Sync failed:", err);
  });

  return cycle;
};

// ============================================================================
// Payment Records
// ============================================================================

/**
 * Upserts a payment record (creates or updates)
 *
 * @param data - Payment data (cycleId, memberId, amount, currency, status, method)
 * @returns Created or updated PaymentRecord
 */
export const upsertPaymentRecord = async (
  data: UpsertPaymentRecordDto,
): Promise<PaymentRecord> => {
  paymentRecordEditSchema.parse({
    amount: data.amount,
    currency: data.currency,
    status: data.status,
    method: data.method,
  });

  // Check if record already exists
  const existingRecord = await PaymentRecordRepository.findByCycleAndMember(
    data.paymentCycleId,
    data.schoolMemberId,
  );

  let record: PaymentRecord;

  if (existingRecord) {
    // Update existing record
    record = await PaymentRecordRepository.update(existingRecord.id, {
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      method: data.method,
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : undefined,
    });
  } else {
    // Create new record
    record = await PaymentRecordRepository.create({
      paymentCycleId: data.paymentCycleId,
      schoolMemberId: data.schoolMemberId,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      method: data.method,
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : undefined,
    });
  }

  sync().catch((err) => {
    console.error("[upsertPaymentRecord] Sync failed:", err);
  });

  return record;
};

/**
 * Gets all payment records for a cycle
 */
export const getPaymentRecordsForCycle = async (
  cycleId: string,
): Promise<PaymentRecord[]> => {
  return PaymentRecordRepository.findByCycleId(cycleId);
};

/**
 * Bulk save payment records for a cycle
 * Upserts each payment record with the provided data
 *
 * Atomic: all records commit in a single database.batch(), or none do.
 */
export const bulkSavePaymentList = async (
  cycleId: string,
  paymentList: Array<{
    memberId: string;
    status: string;
    amount: number;
    currency: string;
    method: PaymentMethod;
  }>,
): Promise<void> => {
  paymentList.forEach((item) =>
    paymentRecordEditSchema.parse({
      amount: item.amount,
      currency: item.currency,
      status: item.status,
      method: item.method,
    }),
  );

  const existingRecords = await PaymentRecordRepository.findByCycleId(cycleId);
  const existingByMember = new Map(
    existingRecords.map((r) => [r.schoolMemberId, r]),
  );
  const collection = database.get<PaymentRecord>("payment_records");

  const operations = paymentList.map((item) => {
    const existing = existingByMember.get(item.memberId);
    const paymentDate = item.status === "paid" ? new Date() : undefined;

    if (existing) {
      return existing.prepareUpdate((r) => {
        r.status = item.status as any;
        r.amount = item.amount;
        r.currency = item.currency;
        r.method = item.method;
        if (paymentDate) r.paymentDate = paymentDate;
      });
    }
    return collection.prepareCreate((r) => {
      r._raw.id = uuidv4();
      r.paymentCycleId = cycleId;
      r.schoolMemberId = item.memberId;
      r.status = item.status as any;
      r.amount = item.amount;
      r.currency = item.currency;
      r.method = item.method;
      if (paymentDate) r.paymentDate = paymentDate;
    });
  });

  await database.write(async () => {
    if (operations.length > 0) {
      await database.batch(operations);
    }
  });

  sync().catch((err) => {
    console.error("[bulkSavePaymentList] Sync failed:", err);
  });
};

/**
 * Bulk update payment records by ID
 * Updates each record by ID with the new data
 *
 * Atomic: all records commit in a single database.batch(), or none do.
 */
export const bulkUpdatePaymentRecords = async (
  updates: Array<{
    recordId: string;
    status: string;
    amount: number;
    currency: string;
    method: PaymentMethod;
  }>,
): Promise<void> => {
  updates.forEach((u) =>
    paymentRecordEditSchema.parse({
      amount: u.amount,
      currency: u.currency,
      status: u.status,
      method: u.method,
    }),
  );

  const collection = database.get<PaymentRecord>("payment_records");
  const records = await Promise.all(
    updates.map((u) => collection.find(u.recordId)),
  );
  const updateByRecordId = new Map(updates.map((u) => [u.recordId, u]));

  const operations = records.map((record) => {
    const update = updateByRecordId.get(record.id)!;
    return record.prepareUpdate((r) => {
      r.status = update.status as any;
      r.amount = update.amount;
      r.currency = update.currency;
      r.method = update.method;
      if (update.status === "paid") r.paymentDate = new Date();
    });
  });

  await database.write(async () => {
    if (operations.length > 0) {
      await database.batch(operations);
    }
  });

  sync().catch((err) => {
    console.error("[bulkUpdatePaymentRecords] Sync failed:", err);
  });
};
