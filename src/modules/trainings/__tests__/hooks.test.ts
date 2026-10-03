import "./stubs";
import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import React, { act } from "react";
import TestRenderer, { type ReactTestRenderer } from "react-test-renderer";
import { flush, resetDatabase, seedMember, seedRow, seedTraining } from "./testUtils";

const hooks = require("../hooks") as typeof import("../hooks");
const service = require("../services/trainingService") as typeof import("../services/trainingService");

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

/** Renders a hook and returns a getter for its latest result. */
async function renderHook<T>(useHook: () => T) {
  let latest!: T;
  const Probe = () => {
    latest = useHook();
    return null;
  };
  let renderer!: ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(React.createElement(Probe));
  });
  await act(flush);
  return { current: () => latest, unmount: () => act(async () => renderer.unmount()) };
}

const settle = () => act(flush);

describe("trainings hooks", () => {
  beforeEach(resetDatabase);

  it("useUpcomingTrainings emits again after a write", async () => {
    const hook = await renderHook(() => hooks.useUpcomingTrainings("org-1"));
    assert.equal(hook.current().isLoading, false);
    assert.equal(hook.current().trainings.length, 0);

    await act(async () => {
      await service.createSingleTrainings({
        organizationId: "org-1", createdBy: "owner", name: "Open mat", visibility: "organization",
        dates: ["2099-01-03", "2099-01-10"], startTime: "10:00", endTime: "11:00",
      });
    });
    await settle();
    assert.deepEqual(hook.current().trainings.map((t) => t.name), ["Open mat", "Open mat"]);
    await hook.unmount();
  });

  it("useSchoolUpcomingTrainings follows the school's organization and audience", async () => {
    await seedRow("schools", { id: "school-a", organization_id: "org-1", name: "A", address: "Main 1" });
    await seedMember("m-a", "school-a");
    await seedTraining({ name: "org" });
    await seedTraining({ name: "other school", visibility: "school", school_id: "school-b" });

    const hook = await renderHook(() => hooks.useSchoolUpcomingTrainings("school-a"));
    assert.deepEqual(hook.current().trainings.map((t) => t.name), ["org"]);

    await act(async () => {
      await service.createSingleTrainings({
        organizationId: "org-1", createdBy: "owner", name: "private", visibility: "whitelist",
        inviteeIds: ["m-a"], dates: ["2099-01-04"], startTime: "10:00", endTime: "11:00",
      });
    });
    await settle();
    assert.deepEqual(hook.current().trainings.map((t) => t.name), ["private", "org"]);
    await hook.unmount();
  });

  it("useTraining returns the training with its series and turns null on delete", async () => {
    const { trainings } = await service.createTrainingSeries({
      organizationId: "org-1", createdBy: "owner", name: "Kids", visibility: "organization",
      startDate: "2099-01-05", endDate: "2099-01-20", rules: [{ weekday: 1, frequency: "weekly", startTime: "17:00", endTime: "18:00" }],
    });
    const id = trainings[0].id;
    const hook = await renderHook(() => hooks.useTraining(id));
    assert.equal(hook.current().training?.id, id);
    assert.equal(hook.current().series?.name, "Kids");

    await act(async () => service.deleteTraining(id));
    await settle();
    assert.equal(hook.current().training, null);
    await hook.unmount();
  });

  it("useSchoolsWithAddress lists schools sorted, with missing addresses as null", async () => {
    await seedRow("schools", { id: "s-b", organization_id: "org-1", name: "Beta", address: "  " });
    await seedRow("schools", { id: "s-a", organization_id: "org-1", name: "Alpha", address: "Main 1" });
    await seedRow("schools", { id: "s-x", organization_id: "org-2", name: "Other", address: "x" });
    const hook = await renderHook(() => hooks.useSchoolsWithAddress("org-1"));
    assert.deepEqual(hook.current().schools, [
      { id: "s-a", name: "Alpha", address: "Main 1" },
      { id: "s-b", name: "Beta", address: null },
    ]);
    await hook.unmount();
  });

  it("useInviteeMembers lists names, greys archived members and filters by school", async () => {
    await seedMember("m-a", "school-a");
    await seedRow("school_members", { id: "m-old", school_id: "school-a", display_name: "Old", status: "archived" });
    await seedMember("m-b", "school-b");
    const [training] = await service.createSingleTrainings({
      organizationId: "org-1", createdBy: "owner", name: "Private", visibility: "whitelist",
      inviteeIds: ["m-a", "m-old", "m-b"], dates: ["2099-01-04"], startTime: "10:00", endTime: "11:00",
    });

    const all = await renderHook(() => hooks.useInviteeMembers(training.id));
    assert.deepEqual(all.current().invitees.map((m) => [m.name, m.inactive]), [
      ["m-a", false],
      ["m-b", false],
      ["Old", true],
    ]);
    await all.unmount();

    const schoolA = await renderHook(() => hooks.useInviteeMembers(training.id, "school-a"));
    assert.deepEqual(schoolA.current().invitees.map((m) => m.id).sort(), ["m-a", "m-old"]);
    await schoolA.unmount();
  });
});
