import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  assignLanes,
  buildMonthCells,
  defaultSelectedDay,
  itemsForDay,
  monthRange,
  seriesFrequencyLabel,
  shiftMonth,
  type CalendarDayCell,
  type CalendarEventSource,
  type CalendarTrainingSource,
} from "@/core/components/Calendar/calendarMonth";

const day = (value: string) => new Date(`${value}T00:00:00Z`);

const event = (id: string, start: string, end = start, status = "active"): CalendarEventSource => ({
  id,
  name: `Event ${id}`,
  address: "Hala",
  startDate: day(start),
  endDate: day(end),
  status,
});

const training = (
  id: string,
  date: string,
  startTime = "18:00",
  status = "active",
  seriesId?: string,
): CalendarTrainingSource => ({
  id,
  name: `Training ${id}`,
  location: "Dojo",
  schoolId: "school-a",
  seriesId,
  date: day(date),
  startTime,
  endTime: "19:30",
  status,
});

// November 2025 starts on a Saturday: 5 blanks before the 1st.
const NOV = { year: 2025, month: 10 };
const TODAY = "2025-11-14";

const cellOf = (cells: (CalendarDayCell | null)[], value: string) => {
  const cell = cells.find((c) => c?.day === value);
  assert.ok(cell, `no cell for ${value}`);
  return cell;
};

describe("buildMonthCells", () => {
  it("pads a Monday-first grid to whole weeks", () => {
    const cells = buildMonthCells(NOV.year, NOV.month, [], [], "all", TODAY, TODAY);
    assert.equal(cells.length % 7, 0);
    assert.deepEqual(cells.slice(0, 5), [null, null, null, null, null]);
    assert.equal(cells[5]?.day, "2025-11-01");
    assert.equal(cells.filter(Boolean).length, 30);
  });

  it("marks today and the selected day", () => {
    const cells = buildMonthCells(NOV.year, NOV.month, [], [], "all", TODAY, "2025-11-22");
    assert.equal(cellOf(cells, TODAY).isToday, true);
    assert.equal(cellOf(cells, TODAY).isSelected, false);
    assert.equal(cellOf(cells, "2025-11-22").isSelected, true);
  });

  it("draws multi-day events as bars, single-day events as dots", () => {
    const events = [event("camp", "2025-11-20", "2025-11-24"), event("exam", "2025-11-15")];
    const cells = buildMonthCells(NOV.year, NOV.month, events, [], "all", TODAY, TODAY);
    assert.deepEqual(cellOf(cells, "2025-11-20").lanes[0], { isStart: true, isEnd: false });
    assert.deepEqual(cellOf(cells, "2025-11-22").lanes[0], { isStart: false, isEnd: false });
    assert.deepEqual(cellOf(cells, "2025-11-24").lanes[0], { isStart: false, isEnd: true });
    assert.equal(cellOf(cells, "2025-11-22").hasEvent, false);
    assert.equal(cellOf(cells, "2025-11-15").hasEvent, true);
    assert.equal(cellOf(cells, "2025-11-25").lanes[0], null);
  });

  it("overlapping multi-day events take the second lane; a third falls back to a dot", () => {
    const events = [
      event("a", "2025-11-20", "2025-11-24"),
      event("b", "2025-11-23", "2025-11-26"),
      event("c", "2025-11-22", "2025-11-23"),
    ];
    const lanes = assignLanes(events);
    assert.equal(lanes.get("a"), 0);
    assert.equal(lanes.get("c"), 1);
    assert.equal(lanes.get("b"), undefined);
    const cells = buildMonthCells(NOV.year, NOV.month, events, [], "all", TODAY, TODAY);
    assert.equal(cellOf(cells, "2025-11-25").hasEvent, true);
  });

  it("cancelled items are counted but get no bar or dot", () => {
    const cells = buildMonthCells(
      NOV.year,
      NOV.month,
      [event("x", "2025-11-10", "2025-11-12", "cancelled")],
      [training("t", "2025-11-10", "18:00", "cancelled")],
      "all",
      TODAY,
      TODAY,
    );
    const cell = cellOf(cells, "2025-11-10");
    assert.deepEqual(cell.lanes, [null, null]);
    assert.equal(cell.hasEvent, false);
    assert.equal(cell.hasTraining, false);
    assert.equal(cell.count, 2);
  });

  it("the filter hides the other kind", () => {
    const events = [event("e", "2025-11-10")];
    const trainings = [training("t", "2025-11-10")];
    const onlyEvents = cellOf(buildMonthCells(NOV.year, NOV.month, events, trainings, "events", TODAY, TODAY), "2025-11-10");
    assert.equal(onlyEvents.hasEvent, true);
    assert.equal(onlyEvents.hasTraining, false);
    const onlyTrainings = cellOf(buildMonthCells(NOV.year, NOV.month, events, trainings, "trainings", TODAY, TODAY), "2025-11-10");
    assert.equal(onlyTrainings.hasEvent, false);
    assert.equal(onlyTrainings.hasTraining, true);
  });
});

describe("itemsForDay", () => {
  it("lists events first, then trainings by start time, with the event day index", () => {
    const items = itemsForDay(
      "2025-11-22",
      [event("camp", "2025-11-20", "2025-11-24"), event("seminar", "2025-11-22")],
      [training("late", "2025-11-22", "19:00"), training("early", "2025-11-22", "10:00", "active", "s1")],
      "all",
    );
    assert.deepEqual(
      items.map((item) => item.id),
      ["camp", "seminar", "early", "late"],
    );
    const camp = items[0];
    assert.ok(camp.kind === "event");
    assert.equal(camp.dayIndex, 3);
    assert.equal(camp.dayCount, 5);
    const early = items[2];
    assert.ok(early.kind === "training");
    assert.equal(early.seriesId, "s1");
  });

  it("keeps cancelled items, flagged", () => {
    const items = itemsForDay("2025-11-10", [], [training("t", "2025-11-10", "18:00", "cancelled")], "all");
    assert.equal(items.length, 1);
    assert.equal(items[0].cancelled, true);
  });

  it("respects the filter", () => {
    const items = itemsForDay("2025-11-10", [event("e", "2025-11-10")], [training("t", "2025-11-10")], "trainings");
    assert.deepEqual(items.map((item) => item.id), ["t"]);
  });
});

describe("month helpers", () => {
  it("monthRange covers the first to the last day", () => {
    assert.deepEqual(monthRange(2025, 1), { from: Date.UTC(2025, 1, 1), to: Date.UTC(2025, 1, 28) });
  });

  it("shiftMonth crosses years", () => {
    assert.deepEqual(shiftMonth(2025, 11, 1), { year: 2026, month: 0 });
    assert.deepEqual(shiftMonth(2026, 0, -1), { year: 2025, month: 11 });
  });

  it("defaultSelectedDay prefers the given day, then today, then the 1st", () => {
    assert.equal(defaultSelectedDay(2025, 10, TODAY, "2025-11-22"), "2025-11-22");
    assert.equal(defaultSelectedDay(2025, 10, TODAY), TODAY);
    assert.equal(defaultSelectedDay(2025, 11, TODAY), "2025-12-01");
  });

  it("seriesFrequencyLabel reads the rules", () => {
    assert.equal(seriesFrequencyLabel(JSON.stringify([{ frequency: "weekly" }, { frequency: "weekly" }])), "weekly");
    assert.equal(seriesFrequencyLabel(JSON.stringify([{ frequency: "monthly" }])), "monthly");
    assert.equal(seriesFrequencyLabel(JSON.stringify([{ frequency: "weekly" }, { frequency: "monthly" }])), "recurring");
    assert.equal(seriesFrequencyLabel("not json"), "recurring");
  });
});
