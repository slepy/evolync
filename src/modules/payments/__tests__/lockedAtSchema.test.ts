import { describe, it } from "node:test";
import assert from "node:assert/strict";
import schema from "@/database/schema";
import migrations from "@/database/migrations";

describe("payment_cycles.locked_at schema", () => {
  it("schema v24 is the latest migration", () => {
    assert.equal(schema.version, 24);
    assert.equal(migrations.maxVersion, 24);
  });

  it("migration v24 adds only the optional payment_cycles.locked_at, matching the schema", () => {
    const step = migrations.sortedMigrations.find((m) => m.toVersion === 24);
    assert.ok(step);
    assert.deepEqual(step.steps.map((s: any) => s.table), ["payment_cycles"]);
    const added = step.steps.flatMap((s: any) => s.columns);
    assert.deepEqual(added.map((c: any) => c.name), ["locked_at"]);
    assert.deepEqual(schema.tables.payment_cycles.columns.locked_at, added[0]);
    assert.equal(added[0].isOptional, true);
    assert.equal(added[0].type, "number");
  });
});
