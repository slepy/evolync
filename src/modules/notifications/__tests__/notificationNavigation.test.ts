import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { database } from "@/database";
import { resolveNotificationOpen } from "../services/notificationNavigation";

async function seedRow(table: string, raw: Record<string, unknown>) {
  await database.write(async () => {
    await database.get(table).create((record: any) => {
      record._raw = { ...record._raw, created_at: 1, updated_at: 1, deleted_at: null, ...raw };
    });
  });
}

describe("resolveNotificationOpen", () => {
  beforeEach(async () => {
    await database.write(() => database.unsafeResetDatabase());
  });

  it("navigates to an order that exists locally", async () => {
    await seedRow("orders", { id: "o1", school_id: "s1", school_member_id: "m1", status: "placed" });
    assert.deepEqual(
      await resolveNotificationOpen({ type: "order_created", entityId: "o1", schoolId: "s1" }),
      { status: "navigate", route: "/school/s1/orders/o1" },
    );
  });

  it("reports an order that is gone or soft-deleted as unavailable", async () => {
    assert.deepEqual(
      await resolveNotificationOpen({ type: "order_created", entityId: "missing", schoolId: "s1" }),
      { status: "unavailable" },
    );

    await seedRow("orders", { id: "o2", school_id: "s1", school_member_id: "m1", status: "placed", deleted_at: 5 });
    assert.deepEqual(
      await resolveNotificationOpen({ type: "order_created", entityId: "o2", schoolId: "s1" }),
      { status: "unavailable" },
    );
  });

  it("checks the event, not the participant, for RSVP notifications", async () => {
    assert.deepEqual(
      await resolveNotificationOpen({ type: "event_rsvp_attending", entityId: "p1", payload: { eventId: "e1" } }),
      { status: "unavailable" },
    );
  });

  it("list destinations need no entity check", async () => {
    assert.deepEqual(
      await resolveNotificationOpen({ type: "payment_created", entityId: "gone" }),
      { status: "navigate", route: "/user/payments" },
    );
    assert.deepEqual(
      await resolveNotificationOpen({ type: "join_request_created", entityId: "gone", schoolId: "s1" }),
      { status: "navigate", route: "/school/s1/students?tab=requests" },
    );
  });

  it("unknown types do nothing", async () => {
    assert.deepEqual(
      await resolveNotificationOpen({ type: "future_type", entityId: "x" }),
      { status: "no-route" },
    );
  });
});
