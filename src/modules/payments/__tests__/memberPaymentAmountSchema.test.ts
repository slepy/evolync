import { describe, it } from "node:test";
import assert from "node:assert/strict";
import schema from "@/database/schema";
import migrations from "@/database/migrations";

const COLUMNS = ["payment_amount", "payment_currency"];

describe("school_members own payment amount", () => {
  it("migration v21 adds the optional payment columns, matching the schema", () => {
    const step = migrations.sortedMigrations.find((m) => m.toVersion === 21);
    assert.ok(step);
    const added = step.steps.flatMap((s: any) => (s.table === "school_members" ? s.columns : []));
    assert.deepEqual(added.map((c: any) => c.name), COLUMNS);
    const columns = schema.tables.school_members.columns;
    for (const column of added) {
      assert.deepEqual(columns[column.name], column, column.name);
      assert.equal(column.isOptional, true, column.name);
    }
  });
});
