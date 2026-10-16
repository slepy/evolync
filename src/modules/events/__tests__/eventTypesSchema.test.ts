import { describe, it } from "node:test";
import assert from "node:assert/strict";
import schema from "@/database/schema";
import migrations from "@/database/migrations";

describe("event types schema", () => {
  it("the schema is v22 and has a migration step up to it", () => {
    assert.ok(schema.version >= 22);
    assert.equal(migrations.maxVersion, schema.version);
  });

  it("migration v22 creates event_types and adds events.type_id, matching the schema", () => {
    const step = migrations.sortedMigrations.find((m) => m.toVersion === 22);
    assert.ok(step);
    const [create, add] = step.steps as any[];
    assert.equal(create.type, "create_table");
    assert.deepEqual(create.schema.columnArray, schema.tables.event_types.columnArray);
    assert.equal(add.type, "add_columns");
    assert.equal(add.table, "events");
    assert.deepEqual(add.columns, [schema.tables.events.columns.type_id]);
    assert.equal(schema.tables.events.columns.type_id.isOptional, true);
  });
});
