import { describe, it } from "node:test";
import assert from "node:assert/strict";
import schema from "@/database/schema";
import migrations from "@/database/migrations";
import { createPaymentCycleSchema } from "../validation/paymentSchema";

const COLUMNS: Record<string, string[]> = {
  school_members: ["payment_amount", "payment_currency"],
  payment_cycles: ["amount", "currency"],
};

describe("own payment amounts schema", () => {
  for (const [table, names] of Object.entries(COLUMNS)) {
    it(`migration v21 adds the optional ${table} amount columns, matching the schema`, () => {
      const step = migrations.sortedMigrations.find((m) => m.toVersion === 21);
      assert.ok(step);
      const added = step.steps.flatMap((s: any) => (s.table === table ? s.columns : []));
      assert.deepEqual(added.map((c: any) => c.name), names);
      const columns = schema.tables[table].columns;
      for (const column of added) {
        assert.deepEqual(columns[column.name], column, column.name);
        assert.equal(column.isOptional, true, column.name);
      }
    });
  }
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
