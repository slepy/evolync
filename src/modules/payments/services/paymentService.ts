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
import { MemberStatus } from "@/modules/students";

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

/**
 * Gets a payment cycle by ID
 */
export const getPaymentCycleById = async (
  cycleId: string,
): Promise<PaymentCycle | null> => {
  return PaymentCycleRepository.findById(cycleId);
};

/**
 * Gets all payment cycles for a school, ordered by period_start descending
 */
export const getPaymentCyclesForSchool = async (
  schoolId: string,
): Promise<PaymentCycle[]> => {
  return PaymentCycleRepository.findBySchoolId(schoolId);
};

/**
 * Updates payment cycle notes
 */
export const updatePaymentCycle = async (
  cycleId: string,
  data: { notes?: string },
): Promise<PaymentCycle> => {
  const updated = await PaymentCycleRepository.update(cycleId, data);

  sync().catch((err) => {
    console.error("[updatePaymentCycle] Sync failed:", err);
  });

  return updated;
};

/**
 * Soft deletes a payment cycle and its payment records
 */
export const deletePaymentCycle = async (cycleId: string): Promise<void> => {
  // Soft delete all payment records for this cycle
  await PaymentRecordRepository.softDeleteByCycleId(cycleId);

  // Soft delete the cycle
  await PaymentCycleRepository.softDelete(cycleId);

  sync().catch((err) => {
    console.error("[deletePaymentCycle] Sync failed:", err);
  });
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
 * Mark a payment as paid
 * Creates the payment record if it doesn't exist (upsert behavior)
 */
export const markPaymentAsPaid = async (
  cycleId: string,
  memberId: string,
  method: PaymentMethod = "cash",
  amount: number = 0,
  currency: string = "PLN",
): Promise<PaymentRecord> => {
  const existingRecord = await PaymentRecordRepository.findByCycleAndMember(
    cycleId,
    memberId,
  );

  let record: PaymentRecord;

  if (existingRecord) {
    // Update existing record
    record = await PaymentRecordRepository.update(existingRecord.id, {
      status: "paid",
      method,
      paymentDate: new Date(),
    });
  } else {
    // Create new record if it doesn't exist
    record = await PaymentRecordRepository.create({
      paymentCycleId: cycleId,
      schoolMemberId: memberId,
      amount,
      currency,
      status: "paid",
      method,
      paymentDate: new Date(),
    });
  }

  sync().catch((err) => {
    console.error("[markPaymentAsPaid] Sync failed:", err);
  });

  return record;
};

/**
 * Bulk create payment records for all members in a cycle
 * Useful when creating a new cycle
 */
export const bulkCreatePaymentRecords = async (
  cycleId: string,
  memberIds: string[],
  defaultAmount: number,
  defaultCurrency: string = "PLN",
): Promise<PaymentRecord[]> => {
  await PaymentRecordRepository.bulkCreate(
    cycleId,
    memberIds,
    defaultAmount,
    defaultCurrency,
  );

  sync().catch((err) => {
    console.error("[bulkCreatePaymentRecords] Sync failed:", err);
  });

  return await getPaymentRecordsForCycle(cycleId);
};

/**
 * Bulk save payment records for a cycle
 * Upserts each payment record with the provided data
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
  for (const item of paymentList) {
    await upsertPaymentRecord({
      paymentCycleId: cycleId,
      schoolMemberId: item.memberId,
      status: item.status as any,
      amount: item.amount,
      currency: item.currency,
      method: item.method,
      paymentDate:
        item.status === "paid" ? new Date().toISOString() : undefined,
    });
  }

  sync().catch((err) => {
    console.error("[bulkSavePaymentList] Sync failed:", err);
  });
};

/**
 * Bulk update payment records by ID
 * Updates each record by ID with the new data
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
  for (const { recordId, status, amount, currency, method } of updates) {
    await PaymentRecordRepository.update(recordId, {
      status: status as any,
      amount,
      currency,
      method,
      paymentDate: status === "paid" ? new Date() : undefined,
    });
  }

  sync().catch((err) => {
    console.error("[bulkUpdatePaymentRecords] Sync failed:", err);
  });
};
