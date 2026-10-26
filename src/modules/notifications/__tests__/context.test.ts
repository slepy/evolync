import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getNotificationAudience,
  isLaunchRoute,
  planNotificationContext,
  type NotificationContextState,
} from "../utils/context";

const memberships = [
  { memberId: "m1", schoolId: "s1" },
  { memberId: "m2", schoolId: "s2" },
];

const state = (over: Partial<NotificationContextState> = {}): NotificationContextState => ({
  ownsOrganization: false,
  memberships,
  activeMembershipId: "m1",
  home: "student",
  ...over,
});

describe("getNotificationAudience", () => {
  it("owner types and student types", () => {
    assert.equal(getNotificationAudience("order_created"), "owner");
    assert.equal(getNotificationAudience("join_request_created"), "owner");
    assert.equal(getNotificationAudience("event_rsvp_attending"), "owner");
    assert.equal(getNotificationAudience("payment_created"), "student");
    assert.equal(getNotificationAudience("event_assigned"), "student");
    assert.equal(getNotificationAudience("join_request_approved"), "student");
    assert.equal(getNotificationAudience("future_type"), null);
  });
});

describe("planNotificationContext", () => {
  it("student notification in the student context of the same school opens in place", () => {
    assert.deepEqual(planNotificationContext({ type: "payment_created", schoolId: "s1" }, state()), {
      home: "student",
      membershipId: "m1",
      switchContext: false,
    });
  });

  it("student notification of another school switches the active membership", () => {
    assert.deepEqual(planNotificationContext({ type: "payment_created", schoolId: "s2" }, state()), {
      home: "student",
      membershipId: "m2",
      switchContext: true,
    });
  });

  it("owner who trains as a student: a payment opens the student context, not over the organization", () => {
    assert.deepEqual(
      planNotificationContext(
        { type: "payment_created", schoolId: "s1" },
        state({ ownsOrganization: true, home: "organization" }),
      ),
      { home: "student", membershipId: "m1", switchContext: true },
    );
  });

  it("student notification without a school id uses the active membership", () => {
    assert.deepEqual(
      planNotificationContext({ type: "event_assigned" }, state({ activeMembershipId: "m2" })),
      { home: "student", membershipId: "m2", switchContext: false },
    );
  });

  it("student notification without that membership has no context", () => {
    assert.equal(planNotificationContext({ type: "payment_created", schoolId: "gone" }, state()), null);
    assert.equal(planNotificationContext({ type: "event_assigned" }, state({ memberships: [] })), null);
  });

  it("owner notification opens the organization context", () => {
    const owner = state({ ownsOrganization: true });
    assert.deepEqual(planNotificationContext({ type: "order_created", schoolId: "s1" }, owner), {
      home: "organization",
      membershipId: null,
      switchContext: true,
    });
    assert.deepEqual(
      planNotificationContext({ type: "join_request_created", schoolId: "s1" }, { ...owner, home: "organization" }),
      { home: "organization", membershipId: null, switchContext: false },
    );
  });

  it("owner notification for a user who is not an owner has no context", () => {
    assert.equal(planNotificationContext({ type: "order_created", schoolId: "s1" }, state()), null);
  });

  it("unknown types have no context", () => {
    assert.equal(planNotificationContext({ type: "future_type" }, state({ ownsOrganization: true })), null);
  });
});

describe("isLaunchRoute", () => {
  it("index and auth screens are launch routes", () => {
    assert.equal(isLaunchRoute("/"), true);
    assert.equal(isLaunchRoute("/auth/login"), true);
    assert.equal(isLaunchRoute("/auth/callback"), true);
    assert.equal(isLaunchRoute("/user/dashboard"), false);
    assert.equal(isLaunchRoute("/organization/dashboard/"), false);
    assert.equal(isLaunchRoute("/authors"), false);
  });
});
