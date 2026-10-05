import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getNotificationRoute } from "../utils/routes";

describe("getNotificationRoute", () => {
  it("N1 order → the school's order detail", () => {
    assert.equal(
      getNotificationRoute({ type: "order_created", entityId: "o1", schoolId: "s1" }),
      "/school/s1/orders/o1",
    );
    assert.equal(getNotificationRoute({ type: "order_created", entityId: "o1" }), "/organization/orders");
  });

  it("N2 join request → the school's join-requests tab", () => {
    assert.equal(
      getNotificationRoute({ type: "join_request_created", entityId: "r1", schoolId: "s1" }),
      "/school/s1/students?tab=requests",
    );
    assert.equal(getNotificationRoute({ type: "join_request_created", entityId: "r1" }), null);
  });

  it("N3 RSVP → the event detail (participant id is not the event id), else the calendar", () => {
    assert.equal(
      getNotificationRoute({ type: "event_rsvp_attending", entityId: "p1", payload: { eventId: "e1" } }),
      "/organization/events/e1",
    );
    assert.equal(
      getNotificationRoute({ type: "event_rsvp_attending", entityId: "p1" }),
      "/organization/calendar", // no events list: the calendar holds them
    );
  });

  it("N4 payment and N5 event assignment → the student's lists", () => {
    assert.equal(getNotificationRoute({ type: "payment_created", entityId: "x" }), "/user/payments");
    assert.equal(getNotificationRoute({ type: "event_assigned", entityId: "x" }), "/user/events");
  });

  it("unknown types have no route", () => {
    assert.equal(getNotificationRoute({ type: "order_ready_for_pickup", entityId: "x" }), null);
  });
});

import { formatUnreadBadge } from "../utils/badge";

describe("formatUnreadBadge", () => {
  it("hides the badge at zero and caps large counts", () => {
    assert.equal(formatUnreadBadge(0), null);
    assert.equal(formatUnreadBadge(-1), null);
    assert.equal(formatUnreadBadge(7), "7");
    assert.equal(formatUnreadBadge(99), "99");
    assert.equal(formatUnreadBadge(100), "99+");
  });
});
