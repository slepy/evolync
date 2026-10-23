import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Q } from "@nozbe/watermelondb";
import { database } from "@/database";
import type EventParticipant from "@/database/models/EventParticipant";
import type Order from "@/database/models/Order";
import type OrderItem from "@/database/models/OrderItem";
import { v4 as uuidv4 } from "uuid";
import type { CartItem, EventOrderDraft } from "../types/dto";

// Network modules the service imports, replaced before it is required.
const stub = (request: string, exports: unknown) => {
  const resolved = require.resolve(request);
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports } as any;
};
let syncs = 0;
stub("@/database/sync", {
  sync: async () => {
    syncs += 1;
    return { success: true, timestamp: Date.now() };
  },
});
stub("@/config/supabase", { supabase: {} });

const service = require("../services/orderService") as typeof import("../services/orderService");

const EVENT = uuidv4();
const SCHOOL = "school-1";

const addParticipant = (memberId: string, takesExam: boolean) =>
  database.write(() =>
    database.get<EventParticipant>("event_participants").create((p) => {
      p.eventId = EVENT;
      p.schoolMemberId = memberId;
      p.status = "attending";
      p.takesExam = takesExam;
    }),
  );

const fee: CartItem = {
  id: "c1",
  variantId: "variant-fee",
  variantName: "Standard",
  productId: "product-fee",
  productName: "Exam fee",
  quantity: 1,
  unitPrice: 120,
  currency: "PLN",
};

const draft = (memberId: string, status: EventOrderDraft["status"] = "placed"): EventOrderDraft => ({
  id: uuidv4(),
  eventId: EVENT,
  schoolId: SCHOOL,
  memberId,
  items: [fee],
  status,
  createdAt: Date.now(),
});

const ordersOf = (memberId: string) =>
  database.get<Order>("orders").query(Q.where("school_member_id", memberId)).fetch();

describe("event orders", () => {
  it("stores nothing until the changes are committed, then the drafts with the event link", async () => {
    await addParticipant("anna", true);
    const pending = draft("anna", "paid");
    assert.equal((await ordersOf("anna")).length, 0);

    const before = syncs;
    await service.commitEventOrderChanges(EVENT, { drafts: [pending], statuses: {} });

    const [order] = await ordersOf("anna");
    assert.equal(order.id, pending.id);
    assert.equal(order.eventId, EVENT);
    assert.equal(order.schoolId, SCHOOL);
    assert.equal(order.status, "paid");
    const items = await database.get<OrderItem>("order_items").query(Q.where("order_id", order.id)).fetch();
    assert.deepEqual(
      items.map((i) => [i.productVariantId, i.quantity, i.unitPrice, i.currency]),
      [["variant-fee", 1, 120, "PLN"]],
    );
    assert.equal(syncs, before + 1);
  });

  it("applies the pending status changes of stored orders", async () => {
    const [order] = await ordersOf("anna");
    await service.commitEventOrderChanges(EVENT, { drafts: [], statuses: { [order.id]: "ready_for_pickup" } });
    assert.equal((await ordersOf("anna"))[0].status, "ready_for_pickup");
  });

  it("rejects the whole save when a draft is for someone who does not take the exam", async () => {
    await addParticipant("marek", false);
    const [stored] = await ordersOf("anna");
    await assert.rejects(
      service.commitEventOrderChanges(EVENT, {
        drafts: [draft("anna"), draft("marek")],
        statuses: { [stored.id]: "completed" },
      }),
      (err: Error) => err.message === "errorOrderEventNotAllowed",
    );
    assert.equal((await ordersOf("anna")).length, 1);
    assert.equal((await ordersOf("anna"))[0].status, "ready_for_pickup");
    assert.equal((await ordersOf("marek")).length, 0);
  });

  it("creates an event order directly only for an exam taker", async () => {
    const items = [{ variantId: "variant-fee", quantity: 1, unitPrice: 120, currency: "PLN" }];
    const order = await service.createOrderWithItems(SCHOOL, "anna", items, EVENT);
    assert.equal(order.eventId, EVENT);
    await assert.rejects(service.createOrderWithItems(SCHOOL, "nobody", items, EVENT), (err: Error) =>
      err.message === "errorOrderEventNotAllowed",
    );
    const plain = await service.createOrderWithItems(SCHOOL, "nobody", items);
    assert.equal(plain.eventId ?? null, null);
  });
});
