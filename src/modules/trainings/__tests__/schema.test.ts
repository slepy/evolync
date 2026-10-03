import { describe, it } from "node:test";
import assert from "node:assert/strict";
import schema from "@/database/schema";
import migrations from "@/database/migrations";

const TABLES = ["trainings", "training_series", "training_invitees"];

describe("trainings schema", () => {
  it("bumps the schema to v20 with a migration step for it", () => {
    assert.equal(schema.version, 20);
    assert.equal(migrations.maxVersion, 20);
  });

  it("migration v20 creates exactly the three trainings tables, matching the schema", () => {
    const step = migrations.sortedMigrations.find((m) => m.toVersion === 20);
    assert.ok(step);
    const created = step.steps.map((s: any) => s.schema);
    assert.deepEqual(created.map((t: any) => t.name), TABLES);
    for (const table of created) {
      assert.deepEqual(table.columnArray, schema.tables[table.name].columnArray, table.name);
    }
  });
});
