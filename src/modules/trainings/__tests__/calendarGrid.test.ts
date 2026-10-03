import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildMonthGrid, toggleDay } from "../components/calendarGrid";

describe("calendar grid", () => {
  it("builds a Monday-first October 2026 grid with past days disabled", () => {
    // 2026-10-01 is a Thursday → 3 leading blanks.
    const rows = buildMonthGrid(2026, 9, "2026-10-03");
    assert.equal(rows.length, 5);
    assert.deepEqual(rows[0].slice(0, 3), [null, null, null]);
    assert.deepEqual(rows[0][3], { day: "2026-10-01", disabled: true });
    assert.deepEqual(rows[0][5], { day: "2026-10-03", disabled: false });
    assert.ok(rows.every((row) => row.length === 7));
  });

  it("a past day cannot be selected", () => {
    assert.deepEqual(toggleDay([], "2026-10-02", "2026-10-03"), []);
    assert.deepEqual(toggleDay([], "2026-10-03", "2026-10-03"), ["2026-10-03"]);
  });

  it("toggles and keeps days sorted; maxDates 1 replaces the day", () => {
    assert.deepEqual(toggleDay(["2026-10-10"], "2026-10-05", "2026-10-03"), ["2026-10-05", "2026-10-10"]);
    assert.deepEqual(toggleDay(["2026-10-05", "2026-10-10"], "2026-10-05", "2026-10-03"), ["2026-10-10"]);
    assert.deepEqual(toggleDay(["2026-10-10"], "2026-10-05", "2026-10-03", 1), ["2026-10-05"]);
  });
});
