import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  canAddOrder,
  canChangeOrderStatus,
  canDeleteOrder,
  canEditOrder,
  choosesStudent,
  studentFieldMode,
  orderEventTarget,
} from "@/modules/orders/components/orderAccess";
import { ORDER_STATUSES } from "@/modules/orders/components/orderListState";

describe("orderAccess", () => {
  it("hides Add new only in the organization", () => {
    assert.equal(canAddOrder("organization"), false);
    assert.equal(canAddOrder("school"), true);
    assert.equal(canAddOrder("student"), true);
  });

  it("lets the organization and the school edit and delete in every status", () => {
    for (const status of ORDER_STATUSES) {
      assert.equal(canEditOrder("organization", status), true);
      assert.equal(canEditOrder("school", status), true);
      assert.equal(canDeleteOrder("school", status), true);
    }
  });

  it("lets the student edit and delete only a placed order", () => {
    for (const status of ORDER_STATUSES) {
      assert.equal(canEditOrder("student", status), status === "placed");
      assert.equal(canDeleteOrder("student", status), status === "placed");
    }
  });

  it("keeps status changes and the student picker to staff", () => {
    assert.equal(canChangeOrderStatus("student"), false);
    assert.equal(canChangeOrderStatus("school"), true);
    assert.equal(canChangeOrderStatus("organization"), true);
    assert.equal(choosesStudent("student"), false);
    assert.equal(choosesStudent("school"), true);
  });
});

describe("studentFieldMode", () => {
  it("lets staff choose the student unless it is fixed by the event", () => {
    assert.equal(studentFieldMode("school", undefined), "choose");
    assert.equal(studentFieldMode("organization", undefined), "choose");
    assert.equal(studentFieldMode("school", "member-1"), "fixed");
  });

  it("shows no STUDENT field to a student", () => {
    assert.equal(studentFieldMode("student", undefined), "none");
    assert.equal(studentFieldMode("student", "member-1"), "none");
  });
});

describe("orderEventTarget", () => {
  it("opens the organization's event for the owner, the own event for a student", () => {
    assert.equal(orderEventTarget("organization", true), "organization");
    assert.equal(orderEventTarget("school", true), "organization");
    assert.equal(orderEventTarget("student", false), "user");
  });

  it("opens nothing from a school screen of someone who does not own the organization", () => {
    assert.equal(orderEventTarget("school", false), null);
  });
});
