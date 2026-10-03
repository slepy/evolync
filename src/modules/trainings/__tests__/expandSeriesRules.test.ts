import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  addMonths,
  expandSeriesRules,
  isValidDay,
  localToday,
  maxSeriesEnd,
} from "../types/helpers";
import type { SeriesRule } from "../types/dto";

const weekly = (weekday: SeriesRule["weekday"], startTime = "18:00", endTime = "19:30"): SeriesRule => ({
  weekday,
  frequency: "weekly",
  startTime,
  endTime,
});

describe("expandSeriesRules", () => {
  it("Mon + Thu weekly over 4 weeks gives 8 sorted trainings", () => {
    // 2026-10-05 is a Monday; 4 full weeks end on Sunday 2026-11-01.
    const out = expandSeriesRules([weekly(4), weekly(1)], "2026-10-05", "2026-11-01");
    assert.equal(out.length, 8);
    assert.deepEqual(
      out.map((o) => o.day),
      ["2026-10-05", "2026-10-08", "2026-10-12", "2026-10-15", "2026-10-19", "2026-10-22", "2026-10-26", "2026-10-29"],
    );
    assert.deepEqual(out[0], { day: "2026-10-05", startTime: "18:00", endTime: "19:30" });
  });

  it("monthly 1st Saturday", () => {
    const rule: SeriesRule = { weekday: 6, frequency: "monthly", weekOfMonth: 1, startTime: "10:00", endTime: "12:00" };
    const out = expandSeriesRules([rule], "2026-10-01", "2027-01-31");
    assert.deepEqual(out.map((o) => o.day), ["2026-10-03", "2026-11-07", "2026-12-05", "2027-01-02"]);
  });

  it("last Friday resolves to the 5th Friday in a 5-Friday month", () => {
    // October 2026 has Fridays 2, 9, 16, 23, 30; November 2026 ends on Fri 27.
    const rule: SeriesRule = { weekday: 5, frequency: "monthly", weekOfMonth: -1, startTime: "17:00", endTime: "18:00" };
    const out = expandSeriesRules([rule], "2026-10-01", "2026-11-30");
    assert.deepEqual(out.map((o) => o.day), ["2026-10-30", "2026-11-27"]);
  });

  it("4th weekday is not the 5th", () => {
    const rule: SeriesRule = { weekday: 5, frequency: "monthly", weekOfMonth: 4, startTime: "17:00", endTime: "18:00" };
    assert.deepEqual(expandSeriesRules([rule], "2026-10-01", "2026-10-31").map((o) => o.day), ["2026-10-23"]);
  });

  it("dedupes two rules producing the same day and start time", () => {
    const monthly: SeriesRule = { weekday: 1, frequency: "monthly", weekOfMonth: 1, startTime: "18:00", endTime: "19:30" };
    const out = expandSeriesRules([weekly(1), monthly], "2026-10-05", "2026-10-11");
    assert.equal(out.length, 1);
  });

  it("keeps two trainings on the same day at different times, sorted by time", () => {
    const out = expandSeriesRules([weekly(1, "19:00", "20:00"), weekly(1, "07:00", "08:00")], "2026-10-05", "2026-10-05");
    assert.deepEqual(out.map((o) => o.startTime), ["07:00", "19:00"]);
  });

  it("respects inclusive start and end bounds", () => {
    // Tue 2026-10-06 .. Mon 2026-10-12: only Mon 12 matches Monday.
    assert.deepEqual(expandSeriesRules([weekly(1)], "2026-10-06", "2026-10-12").map((o) => o.day), ["2026-10-12"]);
    assert.deepEqual(expandSeriesRules([weekly(1)], "2026-10-06", "2026-10-11"), []);
    assert.deepEqual(expandSeriesRules([], "2026-10-01", "2026-12-31"), []);
  });

  it("monthly rule without weekOfMonth produces nothing", () => {
    const rule = { weekday: 1, frequency: "monthly", startTime: "18:00", endTime: "19:00" } as SeriesRule;
    assert.deepEqual(expandSeriesRules([rule], "2026-10-01", "2026-12-31"), []);
  });
});

describe("day helpers", () => {
  it("addMonths clamps to the month end; 6-month cap", () => {
    assert.equal(addMonths("2026-08-31", 6), "2027-02-28");
    assert.equal(maxSeriesEnd("2026-10-03"), "2027-04-03");
  });

  it("validates days and formats the local day", () => {
    assert.ok(isValidDay("2026-02-28"));
    assert.ok(!isValidDay("2026-02-30"));
    assert.ok(!isValidDay("2026-2-3"));
    assert.equal(localToday(new Date(2026, 0, 9, 23, 59)), "2026-01-09");
  });
});
