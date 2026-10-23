import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { OrderListEntry } from "../../hooks/useOrdersList";
import type { CartItem, EventOrderDraft } from "../../types/dto";
import {
  emptyEventOrderChanges,
  eventOrdersByMember,
  hasEventOrderChanges,
  pruneOrderStatuses,
  showsAddOrder,
  withDraftOrder,
  withOrderStatus,
} from "../eventOrderDrafts";

const item = (productName: string, quantity = 1, unitPrice = 100, currency = "PLN"): CartItem => ({
  id: `${productName}-item`,
  variantId: `${productName}-v`,
  variantName: "Standard",
  productId: `${productName}-p`,
  productName,
  quantity,
  unitPrice,
  currency,
});

const draft = (id: string, memberId: string, items: CartItem[]): EventOrderDraft => ({
  id,
  eventId: "e1",
  schoolId: "s1",
  memberId,
  items,
  status: "placed",
  createdAt: Date.UTC(2099, 5, 12),
});

const stored = (orderId: string, memberId: string, status: OrderListEntry["status"] = "placed"): OrderListEntry => ({
  orderId,
  schoolId: "s1",
  status,
  createdAt: new Date(Date.UTC(2099, 5, 1)),
  memberId,
  memberName: memberId,
  itemCount: 3,
  totalsByCurrency: { PLN: 385 },
  items: [
    { variantId: "v1", productId: "p1", productName: "Belt", variantName: "Standard", imageUrl: null, quantity: 1 },
    { variantId: "v2", productId: "p2", productName: "Gi", variantName: "160", imageUrl: null, quantity: 2 },
  ],
});

describe("event order drafts", () => {
  it("adds, replaces in place and drops a draft without products", () => {
    let changes = emptyEventOrderChanges();
    assert.equal(hasEventOrderChanges(changes), false);
    changes = withDraftOrder(changes, draft("d1", "m1", [item("Exam fee")]));
    changes = withDraftOrder(changes, draft("d2", "m2", [item("Belt")]));
    assert.equal(hasEventOrderChanges(changes), true);

    changes = withDraftOrder(changes, draft("d1", "m1", [item("Exam fee"), item("Belt")]));
    assert.deepEqual(changes.drafts.map((d) => [d.id, d.items.length]), [["d1", 2], ["d2", 1]]);

    changes = withDraftOrder(changes, draft("d1", "m1", []));
    assert.deepEqual(changes.drafts.map((d) => d.id), ["d2"]);
  });

  it("keeps a stored order's new status as a pending change until it returns", () => {
    const row = { id: "o1", draft: false, storedStatus: "placed" as const };
    let changes = withOrderStatus(emptyEventOrderChanges(), row, "paid");
    assert.deepEqual(changes.statuses, { o1: "paid" });
    assert.equal(hasEventOrderChanges(changes), true);
    changes = withOrderStatus(changes, row, "placed");
    assert.deepEqual(changes.statuses, {});
    assert.equal(hasEventOrderChanges(changes), false);
  });

  it("changes a draft's own status", () => {
    const changes = withDraftOrder(emptyEventOrderChanges(), draft("d1", "m1", [item("Exam fee")]));
    const next = withOrderStatus(changes, { id: "d1", draft: true, storedStatus: "placed" }, "paid");
    assert.equal(next.drafts[0].status, "paid");
    assert.deepEqual(next.statuses, {});
  });

  it("drops pending statuses of deleted orders and statuses already stored", () => {
    const changes = { drafts: [], statuses: { o1: "paid", o2: "ready_for_pickup", gone: "paid" } as const };
    const next = pruneOrderStatuses({ ...changes, statuses: { ...changes.statuses } }, [
      { orderId: "o1", status: "paid" },
      { orderId: "o2", status: "placed" },
    ]);
    assert.deepEqual(next.statuses, { o2: "ready_for_pickup" });
  });

  it("lists stored orders with their pending status, then the drafts, per member", () => {
    let changes = withDraftOrder(emptyEventOrderChanges(), draft("d1", "m1", [item("Exam fee", 1, 120)]));
    changes = withOrderStatus(changes, { id: "o1", draft: false, storedStatus: "placed" }, "paid");
    const byMember = eventOrdersByMember([stored("o1", "m1"), stored("o2", "m2", "processing")], changes);

    const anna = byMember.get("m1")!;
    assert.deepEqual(
      anna.map((r) => [r.id, r.draft, r.status, r.storedStatus, r.productName, r.itemCount]),
      [
        ["o1", false, "paid", "placed", null, 3],
        ["d1", true, "placed", "placed", "Exam fee", 1],
      ],
    );
    assert.deepEqual(anna[1].totalsByCurrency, { PLN: 120 });
    assert.equal(byMember.get("m2")![0].status, "processing");
    assert.equal(byMember.has("m3"), false);
  });

  it("offers Add order only to exam takers of an event with exams planned", () => {
    assert.equal(showsAddOrder(true, true), true);
    assert.equal(showsAddOrder(true, false), false);
    assert.equal(showsAddOrder(false, true), false);
  });
});
