import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  eventTypeFilterOptions,
  filterEventList,
  NO_EVENT_TYPE,
  toggleExpandedId,
  withFromDay,
  type EventListSource,
} from "../components/eventList";

const day = (value: string) => new Date(`${value}T00:00:00Z`);
const event = (id: string, start: string, end = start, typeId?: string, name = `Event ${id}`): EventListSource => ({
  id,
  name,
  typeId,
  startDate: day(start),
  endDate: day(end),
});

const ids = (rows: EventListSource[]) => rows.map((r) => r.id);
const MARCH = { from: "2099-03-01", to: "2099-03-31" };

describe("filterEventList", () => {
  it("keeps events overlapping the range, edges included", () => {
    const events = [
      event("before", "2099-02-20", "2099-02-28"),
      event("ends-on-from", "2099-02-25", "2099-03-01"),
      event("inside", "2099-03-10"),
      event("starts-on-to", "2099-03-31", "2099-04-03"),
      event("spanning", "2099-02-01", "2099-05-01"),
      event("after", "2099-04-01"),
    ];
    assert.deepEqual(ids(filterEventList(events, { ...MARCH, typeId: null })), [
      "spanning",
      "ends-on-from",
      "inside",
      "starts-on-to",
    ]);
  });

  it("narrows to one type, or to events without one", () => {
    const events = [event("camp", "2099-03-02", undefined, "camp"), event("seminar", "2099-03-03", undefined, "seminar"), event("legacy", "2099-03-04")];
    assert.deepEqual(ids(filterEventList(events, { ...MARCH, typeId: "camp" })), ["camp"]);
    assert.deepEqual(ids(filterEventList(events, { ...MARCH, typeId: NO_EVENT_TYPE })), ["legacy"]);
    assert.deepEqual(ids(filterEventList(events, { ...MARCH, typeId: null })), ["camp", "seminar", "legacy"]);
  });

  it("sorts by start date, then by name", () => {
    const events = [
      event("b", "2099-03-05", undefined, undefined, "Zumba"),
      event("c", "2099-03-01"),
      event("a", "2099-03-05", undefined, undefined, "Aikido"),
    ];
    assert.deepEqual(ids(filterEventList(events, { ...MARCH, typeId: null })), ["c", "a", "b"]);
  });

  it("does not reorder the input", () => {
    const events = [event("b", "2099-03-05"), event("a", "2099-03-01")];
    filterEventList(events, { ...MARCH, typeId: null });
    assert.deepEqual(ids(events), ["b", "a"]);
  });
});

describe("eventTypeFilterOptions", () => {
  const types = [
    { id: "camp", name: "Camp" },
    { id: "seminar", name: "Seminar" },
  ];
  const labels = { all: "All", none: "No type" };

  it("offers All and every type", () => {
    const options = eventTypeFilterOptions([event("a", "2099-03-02", undefined, "camp")], types, MARCH, labels);
    assert.deepEqual(options.map((o) => o.label), ["All", "Camp", "Seminar"]);
    assert.equal(options[0].value, "");
  });

  it("adds No type only when an event in the range has none", () => {
    const outside = eventTypeFilterOptions([event("a", "2099-04-02")], types, MARCH, labels);
    assert.equal(outside.at(-1)?.label, "Seminar");
    const inside = eventTypeFilterOptions([event("a", "2099-03-02")], types, MARCH, labels);
    assert.deepEqual(inside.at(-1), { value: NO_EVENT_TYPE, label: "No type" });
  });
});

describe("withFromDay", () => {
  it("moves TO along when FROM passes it", () => {
    assert.deepEqual(withFromDay(MARCH, "2099-03-10"), { from: "2099-03-10", to: "2099-03-31" });
    assert.deepEqual(withFromDay(MARCH, "2099-04-10"), { from: "2099-04-10", to: "2099-04-10" });
  });
});

describe("toggleExpandedId", () => {
  it("expands a collapsed row and keeps the others", () => {
    assert.deepEqual([...toggleExpandedId(new Set(["a"]), "b")], ["a", "b"]);
  });

  it("collapses an expanded row", () => {
    assert.deepEqual([...toggleExpandedId(new Set(["a", "b"]), "a")], ["b"]);
  });

  it("returns a new set without changing the previous one", () => {
    const ids = new Set(["a"]);
    assert.notEqual(toggleExpandedId(ids, "a"), ids);
    assert.deepEqual([...ids], ["a"]);
  });
});
