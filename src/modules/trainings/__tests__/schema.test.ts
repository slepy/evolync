import { describe, it } from "node:test";
import assert from "node:assert/strict";
import schema from "@/database/schema";
import migrations from "@/database/migrations";

const TABLES = ["trainings", "training_series", "training_invitees"];

describe("trainings schema", () => {
  it("the schema has a migration step for every version up to its own (v20 included)", () => {
    assert.ok(schema.version >= 20);
    assert.equal(migrations.maxVersion, schema.version);
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
