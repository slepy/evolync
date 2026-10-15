import "@/modules/trainings/__tests__/stubs";
import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import React, { act } from "react";
import TestRenderer, { type ReactTestRenderer } from "react-test-renderer";
import { flush, resetDatabase, seedRow } from "@/modules/trainings/__tests__/testUtils";

const { useEventList } = require("../hooks/useEventList") as typeof import("../hooks/useEventList");

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const seedEvent = (row: Record<string, unknown>) =>
  seedRow("events", {
    organization_id: "org-1",
    school_id: null,
    name: "Event",
    short_note: null,
    address: null,
    start_date: Date.UTC(2099, 2, 10),
    end_date: Date.UTC(2099, 2, 10),
    price: 0,
    currency: "PLN",
    visibility: "organization",
    status: "active",
    created_by: "owner",
    ...row,
  });

async function render(from: string, to: string) {
  let latest!: ReturnType<typeof useEventList>;
  const Probe = () => {
    latest = useEventList("org-1", from, to);
    return null;
  };
  let renderer!: ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(React.createElement(Probe));
  });
  await act(flush);
  return { current: () => latest, unmount: () => act(async () => renderer.unmount()) };
}

describe("useEventList", () => {
  beforeEach(resetDatabase);

  it("loads the organization's events in the range and its types", async () => {
    await seedRow("event_types", { id: "camp", organization_id: "org-1", name: "Camp", created_by: "owner" });
    await seedRow("event_types", { id: "other", organization_id: "org-2", name: "Other", created_by: "owner" });
    await seedEvent({ id: "in", type_id: "camp" });
    await seedEvent({ id: "cancelled", status: "cancelled" });
    await seedEvent({ id: "later", start_date: Date.UTC(2099, 4, 1), end_date: Date.UTC(2099, 4, 1) });
    await seedEvent({ id: "foreign", organization_id: "org-2" });

    const hook = await render("2099-03-01", "2099-03-31");
    assert.equal(hook.current().isLoading, false);
    assert.deepEqual(hook.current().events.map((e) => e.id).sort(), ["cancelled", "in"]);
    assert.deepEqual(hook.current().types.map((t) => t.name), ["Camp"]);
    assert.equal(hook.current().typeNames.get("camp"), "Camp");
    await hook.unmount();
  });
});
