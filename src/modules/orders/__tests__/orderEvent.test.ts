import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { orderEvent } from "../hooks/useOrdersList";

describe("orderEvent", () => {
  const names = new Map([["e1", "Summer grading"]]);

  it("names the event of an event order", () => {
    assert.deepEqual(orderEvent("e1", names), { eventId: "e1", eventName: "Summer grading" });
  });

  it("keeps the link but shows no name when the event is not on the device", () => {
    assert.deepEqual(orderEvent("gone", names), { eventId: "gone", eventName: undefined });
  });

  it("adds nothing to a regular order", () => {
    assert.deepEqual(orderEvent(undefined, names), {});
    assert.deepEqual(orderEvent(null, names), {});
  });
});
