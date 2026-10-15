import { describe, it } from "node:test";
import assert from "node:assert/strict";
import schema from "@/database/schema";
import migrations from "@/database/migrations";
import { createPaymentCycleSchema } from "../validation/paymentSchema";

const COLUMNS = ["payment_amount", "payment_currency"];

describe("own payment amounts schema", () => {
  it("migration v21 adds only the optional school_members amount columns, matching the schema", () => {
    const step = migrations.sortedMigrations.find((m) => m.toVersion === 21);
    assert.ok(step);
    assert.deepEqual(step.steps.map((s: any) => s.table), ["school_members"]);
    const added = step.steps.flatMap((s: any) => s.columns);
    assert.deepEqual(added.map((c: any) => c.name), COLUMNS);
    const columns = schema.tables.school_members.columns;
    for (const column of added) {
      assert.deepEqual(columns[column.name], column, column.name);
      assert.equal(column.isOptional, true, column.name);
    }
  });

  it("payment_cycles has no amount columns: a one-off amount is written to the records only", () => {
    const columns = schema.tables.payment_cycles.columns;
    assert.equal(columns.amount, undefined);
    assert.equal(columns.currency, undefined);
  });
});

describe("createPaymentCycleSchema", () => {
  const period = { schoolId: "s1", periodStart: "2026-10-01", periodEnd: "2026-10-31" };

  it("accepts a period with its own amount and currency, or with neither", () => {
    assert.ok(createPaymentCycleSchema.safeParse(period).success);
    assert.ok(createPaymentCycleSchema.safeParse({ ...period, amount: 0, currency: "EUR" }).success);
  });

  it("rejects an amount without a currency and a currency without an amount", () => {
    const noCurrency = createPaymentCycleSchema.safeParse({ ...period, amount: 50 });
    assert.equal(noCurrency.success, false);
    assert.equal(noCurrency.error?.issues[0].message, "paymentValidationCurrencyRequired");
    const noAmount = createPaymentCycleSchema.safeParse({ ...period, currency: "EUR" });
    assert.equal(noAmount.success, false);
    assert.equal(noAmount.error?.issues[0].message, "amountRequired");
  });

  it("rejects a negative amount", () => {
    assert.equal(createPaymentCycleSchema.safeParse({ ...period, amount: -1, currency: "EUR" }).success, false);
  });
});
