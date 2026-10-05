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
import type { CalendarScope, CalendarSource } from "@/core/components/Calendar/useCalendarMonth";

const { useCalendarMonth } = require("@/core/components/Calendar/useCalendarMonth") as typeof import("@/core/components/Calendar/useCalendarMonth");

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// January 2099; the month before and after are out of range.
const JAN_5 = Date.UTC(2099, 0, 5);
const JAN_31 = Date.UTC(2099, 0, 31);
const DEC_30 = Date.UTC(2098, 11, 30);
const FEB_1 = Date.UTC(2099, 1, 1);

const seedEvent = (row: Record<string, unknown>) =>
  seedRow("events", {
    organization_id: "org-1",
    school_id: null,
    name: "Event",
    short_note: null,
    address: null,
    start_date: JAN_5,
    end_date: JAN_5,
    price: 0,
    currency: "PLN",
    visibility: "organization",
    status: "active",
    created_by: "owner",
    ...row,
  });

async function renderMonth(scope: CalendarScope, show?: CalendarSource[]) {
  let latest!: ReturnType<typeof useCalendarMonth>;
  const Probe = () => {
    latest = useCalendarMonth(scope, 2099, 0, show);
    return null;
  };
  let renderer!: ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(React.createElement(Probe));
  });
  await act(flush);
  return {
    current: () => latest,
    eventIds: () => latest.events.map((e) => e.id).sort(),
    trainingIds: () => latest.trainings.map((t) => t.id).sort(),
    unmount: () => act(async () => renderer.unmount()),
  };
}

describe("useCalendarMonth", () => {
  beforeEach(async () => {
    await resetDatabase();
    await seedRow("schools", { id: "school-a", organization_id: "org-1", name: "Mokotów", address: "Main 1" });
    await seedRow("schools", { id: "school-b", organization_id: "org-1", name: "Ochota", address: "Main 2" });
  });

  it("organization: events overlapping the month and trainings in it, cancelled included", async () => {
    await seedEvent({ id: "e-in" });
    await seedEvent({ id: "e-spanning", start_date: DEC_30, end_date: Date.UTC(2099, 0, 2) });
    await seedEvent({ id: "e-before", start_date: DEC_30, end_date: DEC_30 });
    await seedEvent({ id: "e-cancelled", status: "cancelled" });
    await seedTraining({ id: "t-in", date: JAN_31, school_id: "school-a" });
    await seedTraining({ id: "t-after", date: FEB_1 });
    await seedTraining({ id: "t-cancelled", date: JAN_5, status: "cancelled" });

    const hook = await renderMonth({ kind: "organization", organizationId: "org-1" });
    assert.equal(hook.current().isLoading, false);
    assert.deepEqual(hook.eventIds(), ["e-cancelled", "e-in", "e-spanning"]);
    assert.deepEqual(hook.trainingIds(), ["t-cancelled", "t-in"]);
    assert.equal(hook.current().schoolNames.get("school-a"), "Mokotów");

    await act(async () => {
      await seedTraining({ id: "t-new", date: JAN_5 });
    });
    await act(flush);
    assert.deepEqual(hook.trainingIds(), ["t-cancelled", "t-in", "t-new"]);
    await hook.unmount();
  });

  it("school: trainings only, never events", async () => {
    await seedEvent({ id: "e-org" });
    await seedTraining({ id: "t-own", visibility: "school", school_id: "school-a" });
    await seedTraining({ id: "t-other", visibility: "school", school_id: "school-b" });
    await seedTraining({ id: "t-org" });

    const hook = await renderMonth({ kind: "school", schoolId: "school-a" });
    assert.deepEqual(hook.eventIds(), []);
    assert.deepEqual(hook.trainingIds(), ["t-org", "t-own"]);
    assert.deepEqual([...hook.current().schoolNames.keys()], ["school-a"]);
    await hook.unmount();
  });

  it("student: their events and their school's trainings", async () => {
    await seedMember("m-a", "school-a");
    await seedEvent({ id: "e-mine" });
    await seedRow("event_participants", { event_id: "e-mine", school_member_id: "m-a", status: "attending" });
    await seedEvent({ id: "e-not-mine" });
    await seedTraining({ id: "t-school", visibility: "school", school_id: "school-a" });

    const hook = await renderMonth({ kind: "student", memberId: "m-a", schoolId: "school-a" });
    assert.deepEqual(hook.eventIds(), ["e-mine"]);
    assert.deepEqual(hook.trainingIds(), ["t-school"]);
    await hook.unmount();
  });

  it("maps series to their frequency", async () => {
    await seedRow("training_series", {
      id: "s-weekly",
      organization_id: "org-1",
      school_id: null,
      name: "Kids",
      location: null,
      visibility: "organization",
      invitee_ids: "[]",
      start_date: JAN_5,
      end_date: JAN_31,
      rules: JSON.stringify([{ weekday: 1, frequency: "weekly", startTime: "18:00", endTime: "19:00" }]),
      previous_series_id: null,
      created_by: "owner",
    });
    await seedTraining({ id: "t-series", series_id: "s-weekly" });

    const hook = await renderMonth({ kind: "organization", organizationId: "org-1" });
    assert.equal(hook.current().seriesFrequency.get("s-weekly"), "weekly");
    await hook.unmount();
  });
});
