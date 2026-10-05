import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatDayTitle,
  formatMonth,
  formatShortDay,
  weekdayLabels,
} from "@/core/components/Calendar/calendarFormat";

describe("calendarFormat", () => {
  it("English labels match the board", () => {
    assert.equal(formatMonth(2025, 10, "en"), "November 2025");
    assert.deepEqual(weekdayLabels("en"), ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]);
    assert.equal(formatDayTitle("2025-11-22", "en"), "Saturday, 22 Nov");
    assert.equal(formatShortDay("2025-11-20", "en"), "20 Nov");
  });

  it("Polish labels start with a capital and have no dots", () => {
    const month = formatMonth(2025, 10, "pl");
    assert.equal(month.charAt(0), month.charAt(0).toUpperCase());
    assert.ok(month.endsWith("2025"));
    assert.ok(weekdayLabels("pl").every((label) => !label.includes(".")));
    assert.ok(formatDayTitle("2025-11-22", "pl").startsWith("Sobota"));
  });
});
