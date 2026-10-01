import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getNotificationContent } from "../utils/content";

/** Echoes the key and its params so assertions can check both. */
const translate = (key: string, params?: Record<string, unknown>) =>
  params ? `${key}${JSON.stringify(params)}` : key;

describe("getNotificationContent", () => {
  it("N1 includes the item count only when items are known", () => {
    const withItems = getNotificationContent(
      { type: "order_created", payload: { studentName: "Ola", itemCount: 3 } },
      translate,
    );
    assert.equal(withItems.title, "notificationOrderCreatedTitle");
    assert.equal(withItems.body, 'notificationOrderCreatedBody{"studentName":"Ola","count":3}');

    const noItems = getNotificationContent(
      { type: "order_created", payload: { studentName: "Ola", itemCount: 0 } },
      translate,
    );
    assert.equal(noItems.body, 'notificationOrderCreatedBodyNoItems{"studentName":"Ola"}');
  });

  it("N2 falls back to generic wording when names are missing", () => {
    const content = getNotificationContent({ type: "join_request_created", payload: {} }, translate);
    assert.equal(
      content.body,
      'notificationJoinRequestBody{"displayName":"notificationSomeone","schoolName":"notificationYourSchool"}',
    );
  });

  it("N3 renders student and event names", () => {
    const content = getNotificationContent(
      { type: "event_rsvp_attending", payload: { studentName: "Ola", eventName: "Camp" } },
      translate,
    );
    assert.equal(content.body, 'notificationRsvpAttendingBody{"studentName":"Ola","eventName":"Camp"}');
  });

  it("N4 formats amount and period", () => {
    const content = getNotificationContent(
      {
        type: "payment_created",
        payload: { amount: "150.00", currency: "PLN", periodStart: "2026-10-01", periodEnd: "2026-10-31" },
      },
      translate,
    );
    const params = JSON.parse(content.body.replace("notificationPaymentCreatedBody", ""));
    assert.match(params.amount, /150/);
    assert.match(params.amount, /PLN/);
    assert.equal(params.period, "1 - 31 October 2026");
  });

  it("N5 formats the event start date without a timezone shift", () => {
    const content = getNotificationContent(
      { type: "event_assigned", payload: { eventName: "Winter Cup", startDate: "2026-12-01" } },
      translate,
    );
    assert.equal(
      content.body,
      'notificationEventAssignedBody{"eventName":"Winter Cup","startDate":"1 December 2026"}',
    );
  });

  it("unknown types render generic text", () => {
    const content = getNotificationContent({ type: "something_new", payload: {} }, translate);
    assert.deepEqual(content, { title: "notificationGenericTitle", body: "notificationGenericBody" });
  });
});
