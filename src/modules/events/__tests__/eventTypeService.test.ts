import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { database } from "@/database";
import type Event from "@/database/models/Event";
import type EventType from "@/database/models/EventType";
import { isEventTypeNameTaken } from "../validation/eventTypeSchema";

// Network modules the service imports, replaced before it is required.
const stub = (request: string, exports: unknown) => {
  const resolved = require.resolve(request);
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports } as any;
};
stub("@/database/sync", { sync: async () => ({ success: true, timestamp: Date.now() }) });
stub("@/config/supabase", { supabase: {} });

const service = require("../services/eventTypeService") as typeof import("../services/eventTypeService");

const ORG = "org-1";
const OTHER_ORG = "org-2";

const create = (name: string, organizationId = ORG) =>
  service.createEventType({ organizationId, name, createdBy: "owner" });

const addEvent = (typeId: string, deleted = false) =>
  database.write(() =>
    database.get<Event>("events").create((e) => {
      e.organizationId = ORG;
      e.name = "Camp";
      e.typeId = typeId;
      e.startDate = new Date(Date.UTC(2099, 0, 1));
      e.endDate = new Date(Date.UTC(2099, 0, 2));
      e.price = 0;
      e.currency = "PLN";
      e.visibility = "organization";
      e.status = "active";
      e.createdBy = "owner";
      if (deleted) e.deletedAt = new Date();
    }),
  );

const rejectsWith = (promise: Promise<unknown>, message: string) =>
  assert.rejects(promise, (err: Error) => err.message === message);

describe("isEventTypeNameTaken", () => {
  const types = [{ id: "a", name: "Camp" }];
  it("compares trimmed names without case", () => {
    assert.equal(isEventTypeNameTaken(" camp ", types), true);
    assert.equal(isEventTypeNameTaken("Seminar", types), false);
  });
  it("ignores the type being renamed", () => {
    assert.equal(isEventTypeNameTaken("CAMP", types, "a"), false);
  });
});

describe("eventTypeService", () => {
  beforeEach(async () => {
    await database.write(() => database.unsafeResetDatabase());
  });

  it("creates a type with a trimmed name in the organization", async () => {
    const type = await create("  Summer camp ");
    assert.equal(type.name, "Summer camp");
    assert.equal(type.organizationId, ORG);
  });

  it("rejects empty, too long and duplicate names", async () => {
    await create("Camp");
    await rejectsWith(create("   "), "eventTypeValidationNameRequired");
    await rejectsWith(create("x".repeat(41)), "eventTypeValidationNameTooLong");
    await rejectsWith(create("camp"), "eventTypeValidationNameTaken");
  });

  it("allows the same name in another organization and after a delete", async () => {
    const camp = await create("Camp");
    await create("Camp", OTHER_ORG);
    await service.deleteEventType(camp.id);
    const again = await create("Camp");
    assert.notEqual(again.id, camp.id);
  });

  it("renames, keeping the uniqueness rule", async () => {
    const camp = await create("Camp");
    await create("Seminar");
    await rejectsWith(service.renameEventType(camp.id, "SEMINAR"), "eventTypeValidationNameTaken");
    const renamed = await service.renameEventType(camp.id, " Winter camp ");
    assert.equal(renamed.name, "Winter camp");
    // Changing only the case of its own name is allowed.
    assert.equal((await service.renameEventType(camp.id, "WINTER CAMP")).name, "WINTER CAMP");
  });

  it("blocks deleting a type that events use, with their count", async () => {
    const camp = await create("Camp");
    await addEvent(camp.id);
    await addEvent(camp.id);
    await addEvent(camp.id, true); // deleted events do not count
    await assert.rejects(service.deleteEventType(camp.id), (err: unknown) => {
      assert.ok(err instanceof service.EventTypeInUseError);
      assert.equal(err.count, 2);
      assert.equal(err.message, "eventTypeInUse");
      return true;
    });
    const kept = await database.get<EventType>("event_types").find(camp.id);
    assert.ok(!kept.deletedAt);
  });

  it("soft deletes an unused type, which stays loadable by id", async () => {
    const camp = await create("Camp");
    await service.deleteEventType(camp.id);
    const row = await database.get<EventType>("event_types").find(camp.id);
    assert.ok(row.deletedAt);
  });
});
