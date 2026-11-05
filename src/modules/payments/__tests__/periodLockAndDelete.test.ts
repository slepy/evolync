import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { database } from "@/database";
import type PaymentCycle from "@/database/models/PaymentCycle";
import type PaymentRecord from "@/database/models/PaymentRecord";
import type { PaymentStatus } from "@/database/models/PaymentRecord";

// Network modules the service imports, replaced before it is required.
const stub = (request: string, exports: unknown) => {
  const resolved = require.resolve(request);
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports } as any;
};
stub("@/database/sync", { sync: async () => ({ success: true, timestamp: Date.now() }) });
stub("@/config/supabase", { supabase: {} });

const service = require("../services/paymentService") as typeof import("../services/paymentService");
const { PaymentCycleRepository, PaymentRecordRepository } = require("../repositories") as typeof import("../repositories");

const seedPeriod = (id: string, statuses: PaymentStatus[]) =>
  database.write(async () => {
    await database.get<PaymentCycle>("payment_cycles").create((c) => {
      c._raw.id = id;
      c.schoolId = "school-1";
      c.periodStart = new Date("2026-10-01T00:00:00Z");
      c.periodEnd = new Date("2026-10-31T00:00:00Z");
    });
    for (const [i, status] of statuses.entries()) {
      await database.get<PaymentRecord>("payment_records").create((r) => {
        r._raw.id = `${id}-r${i}`;
        r.paymentCycleId = id;
        r.schoolMemberId = `m${i}`;
        r.amount = 150;
        r.currency = "PLN";
        r.status = status;
        r.method = "cash";
      });
    }
  });

const find = (id: string) => database.get<PaymentCycle>("payment_cycles").find(id);

describe("lock / unlock a period", () => {
  beforeEach(async () => {
    await database.write(() => database.unsafeResetDatabase());
    await seedPeriod("oct", ["pending"]);
  });

  it("lock sets lockedAt, unlock clears it", async () => {
    await service.lockPaymentCycle("oct");
    assert.ok((await find("oct")).lockedAt instanceof Date);
    await service.unlockPaymentCycle("oct");
    assert.equal((await find("oct")).lockedAt, null);
  });
});

describe("deletePaymentCycle", () => {
  beforeEach(async () => {
    await database.write(() => database.unsafeResetDatabase());
  });

  it("soft-deletes the period and all its records in one batch", async () => {
    await seedPeriod("oct", ["pending", "cancelled"]);
    await seedPeriod("nov", ["pending"]);

    await service.deletePaymentCycle("oct");

    assert.equal(await PaymentCycleRepository.findById("oct"), null);
    assert.deepEqual(await PaymentRecordRepository.findByCycleId("oct"), []);
    const cycle = await find("oct");
    const record = await database.get<PaymentRecord>("payment_records").find("oct-r1");
    assert.equal(record.deletedAt?.getTime(), cycle.deletedAt?.getTime());
    assert.equal((await PaymentRecordRepository.findByCycleId("nov")).length, 1);
  });

  it("deletes a period with no payments", async () => {
    await seedPeriod("empty", []);
    await service.deletePaymentCycle("empty");
    assert.equal(await PaymentCycleRepository.findById("empty"), null);
  });

  it("throws and deletes nothing while a payment is paid", async () => {
    await seedPeriod("oct", ["paid", "pending", "paid"]);
    await assert.rejects(service.deletePaymentCycle("oct"), { message: "paymentsDeleteBlockedPaid" });
    assert.ok(await PaymentCycleRepository.findById("oct"));
    assert.equal((await PaymentRecordRepository.findByCycleId("oct")).length, 3);
  });

  it("throws and deletes nothing while the period is locked", async () => {
    await seedPeriod("oct", ["pending"]);
    await service.lockPaymentCycle("oct");
    await assert.rejects(service.deletePaymentCycle("oct"), { message: "paymentsDeleteBlockedLocked" });
    assert.ok(await PaymentCycleRepository.findById("oct"));
  });
});
