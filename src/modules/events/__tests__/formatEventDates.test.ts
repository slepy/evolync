import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatEventDates } from "../components/formatEventDates";

(globalThis as { t?: unknown }).t = (key: string) => (key === "locale" ? "en" : key);

describe("formatEventDates", () => {
  it("shows one day once", () => {
    assert.equal(formatEventDates("2025-11-22", "2025-11-22"), "Nov 22, 2025");
  });

  it("joins days of one month", () => {
    assert.equal(formatEventDates("2025-11-20", "2025-11-24"), "20–Nov 24, 2025");
  });

  it("keeps the year once within a year, twice across years", () => {
    assert.equal(formatEventDates("2025-11-28", "2025-12-03"), "Nov 28 – Dec 3, 2025");
    assert.equal(formatEventDates("2025-12-29", "2026-01-02"), "Dec 29, 2025 – Jan 2, 2026");
  });
});
