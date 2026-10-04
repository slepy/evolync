import "@/modules/trainings/__tests__/stubs";
import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import React, { act } from "react";
import TestRenderer, { type ReactTestRenderer } from "react-test-renderer";
import {
  flush,
  resetDatabase,
  seedMember,
  seedRow,
  seedTraining,
} from "@/modules/trainings/__tests__/testUtils";
import type { NextUpScope, NextUpSource } from "@/core/components/NextUp/useNextUp";

const { useNextUp } = require("@/core/components/NextUp/useNextUp") as typeof import("@/core/components/NextUp/useNextUp");

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const DAY_A = Date.UTC(2099, 0, 5);
const DAY_B = Date.UTC(2099, 0, 6);

const seedEvent = (row: Record<string, unknown>) =>
  seedRow("events", {
    organization_id: "org-1",
    school_id: null,
    name: "Event",
    short_note: null,
    address: null,
    start_date: DAY_A,
    end_date: DAY_A,
    price: 0,
    currency: "PLN",
    visibility: "organization",
    status: "active",
    created_by: "owner",
    ...row,
  });

async function renderNextUp(scope: NextUpScope, show?: NextUpSource[]) {
  let latest!: ReturnType<typeof useNextUp>;
  const Probe = () => {
    latest = useNextUp(scope, show);
    return null;
  };
  let renderer!: ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(React.createElement(Probe));
  });
  await act(flush);
  return {
    ids: () => latest.nextUp?.items.map((item) => item.id) ?? [],
    current: () => latest,
    unmount: () => act(async () => renderer.unmount()),
  };
}

describe("useNextUp", () => {
  beforeEach(async () => {
    await resetDatabase();
    await seedRow("schools", { id: "school-a", organization_id: "org-1", name: "A", address: "Main 1" });
    await seedRow("schools", { id: "school-b", organization_id: "org-1", name: "B", address: "Main 2" });
  });

  it("organization: all items of the nearest day, reactive to writes", async () => {
    await seedEvent({ id: "e1", name: "Seminar", start_date: DAY_A, end_date: DAY_A });
    await seedTraining({ id: "t1", date: DAY_A, start_time: "16:00" });
    await seedTraining({ id: "t2", date: DAY_B });
    await seedEvent({ id: "e-cancelled", start_date: DAY_A, end_date: DAY_A, status: "cancelled" });

    const hook = await renderNextUp({ kind: "organization", organizationId: "org-1" });
    assert.equal(hook.current().isLoading, false);
    assert.equal(hook.current().nextUp?.day, "2099-01-05");
    assert.deepEqual(hook.ids(), ["e1", "t1"]);

    await act(async () => {
      await seedTraining({ id: "t0", date: DAY_A, start_time: "09:00" });
    });
    await act(flush);
    assert.deepEqual(hook.ids(), ["e1", "t0", "t1"]);
    await hook.unmount();
  });

  it("show filters the sources", async () => {
    await seedEvent({ id: "e1" });
    await seedTraining({ id: "t2", date: DAY_B });

    const hook = await renderNextUp({ kind: "organization", organizationId: "org-1" }, ["trainings"]);
    assert.equal(hook.current().nextUp?.day, "2099-01-06");
    assert.deepEqual(hook.ids(), ["t2"]);
    await hook.unmount();
  });

  it("school: organization, own-school and whitelisted-member items only", async () => {
    await seedMember("m-a", "school-a");
    await seedMember("m-b", "school-b");
    await seedEvent({ id: "e-org" });
    await seedEvent({ id: "e-own", visibility: "school", school_id: "school-a" });
    await seedEvent({ id: "e-other", visibility: "school", school_id: "school-b" });
    await seedEvent({ id: "e-white", visibility: "whitelist" });
    await seedRow("event_participants", { event_id: "e-white", school_member_id: "m-a", status: "attending" });
    await seedEvent({ id: "e-white-b", visibility: "whitelist" });
    await seedRow("event_participants", { event_id: "e-white-b", school_member_id: "m-b", status: "attending" });
    await seedTraining({ id: "t-other", date: DAY_A, visibility: "school", school_id: "school-b" });

    const hook = await renderNextUp({ kind: "school", schoolId: "school-a" });
    assert.deepEqual([...hook.ids()].sort(), ["e-org", "e-own", "e-white"]);
    await hook.unmount();
  });

  it("student: their events and their school's trainings", async () => {
    await seedMember("m-a", "school-a");
    await seedEvent({ id: "e-mine", start_date: DAY_B, end_date: DAY_B });
    await seedRow("event_participants", { event_id: "e-mine", school_member_id: "m-a", status: "attending" });
    await seedEvent({ id: "e-not-mine" });
    await seedTraining({ id: "t-school", date: DAY_B, visibility: "school", school_id: "school-a" });

    const hook = await renderNextUp({ kind: "student", memberId: "m-a", schoolId: "school-a" });
    assert.equal(hook.current().nextUp?.day, "2099-01-06");
    assert.deepEqual(hook.ids(), ["e-mine", "t-school"]);
    await hook.unmount();
  });

  it("returns null when nothing is planned", async () => {
    const hook = await renderNextUp({ kind: "organization", organizationId: "org-1" });
    assert.equal(hook.current().nextUp, null);
    assert.equal(hook.current().isLoading, false);
    await hook.unmount();
  });
});
