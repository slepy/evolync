import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fromPickerDate, toPickerDate } from "../dateTimeValue";

describe("dateTimeValue", () => {
  it("round-trips a day through the local picker date", () => {
    const date = toPickerDate("date", "2025-11-22");
    assert.equal(date.getFullYear(), 2025);
    assert.equal(date.getMonth(), 10);
    assert.equal(date.getDate(), 22);
    assert.equal(fromPickerDate("date", date), "2025-11-22");
  });

  it("round-trips a wall-clock time", () => {
    assert.equal(fromPickerDate("time", toPickerDate("time", "07:05")), "07:05");
  });

  it("falls back on bad input", () => {
    assert.equal(fromPickerDate("time", toPickerDate("time", "")), "18:00");
    assert.ok(!Number.isNaN(toPickerDate("date", "nope").getTime()));
  });
});
