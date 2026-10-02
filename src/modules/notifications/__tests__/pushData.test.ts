import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parsePushData } from "../utils/pushData";
import { getNotificationRoute } from "../utils/routes";

describe("parsePushData", () => {
  it("maps send-push data to a notification target", () => {
    const parsed = parsePushData({
      notificationId: "n1",
      type: "event_rsvp_attending",
      entityType: "event_participant",
      entityId: "p1",
      schoolId: "s1",
      eventId: "e1",
    });
    assert.equal(parsed.kind, "notification");
    if (parsed.kind !== "notification") return;
    assert.equal(parsed.notificationId, "n1");
    assert.equal(getNotificationRoute(parsed.target), "/organization/events/e1", "same deep-link map as the inbox");
  });

  it("each requested type routes from push data alone", () => {
    const routes = [
      ["order_created", "/school/s1/orders/x"],
      ["join_request_created", "/school/s1/students?tab=requests"],
      ["payment_created", "/user/payments"],
      ["event_assigned", "/user/events"],
    ];
    for (const [type, route] of routes) {
      const parsed = parsePushData({ notificationId: "n", type, entityType: "t", entityId: "x", schoolId: "s1" });
      assert.equal(parsed.kind === "notification" && getNotificationRoute(parsed.target), route, type);
    }
  });

  it("summary and malformed pushes open the inbox", () => {
    assert.deepEqual(parsePushData({ type: "summary" }), { kind: "inbox" });
    assert.deepEqual(parsePushData(null), { kind: "inbox" });
    assert.deepEqual(parsePushData({ entityId: 3 }), { kind: "inbox" });
  });
});
