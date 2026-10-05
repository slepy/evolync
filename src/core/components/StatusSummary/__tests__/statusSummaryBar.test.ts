import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { statusSummaryBar } from "../statusSummaryBar";

const items = (paid: number, attending: number, absent: number) => [
  { key: "paid", count: paid, barColor: "green" },
  { key: "attending", count: attending, barColor: "amber" },
  { key: "absent", count: absent, barColor: "gray" },
];

describe("statusSummaryBar", () => {
  it("sizes segments by count, outer ends rounded 5, inner 2", () => {
    const bar = statusSummaryBar(items(6, 9, 4));
    assert.deepEqual(
      bar.map((s) => [s.key, s.flex, s.radiusLeft, s.radiusRight]),
      [
        ["paid", 6, 5, 2],
        ["attending", 9, 2, 2],
        ["absent", 4, 2, 5],
      ],
    );
  });

  it("drops zero counts and moves the outer radius to the new end", () => {
    const bar = statusSummaryBar(items(0, 3, 0));
    assert.deepEqual(bar.map((s) => [s.key, s.radiusLeft, s.radiusRight]), [["attending", 5, 5]]);
    assert.deepEqual(statusSummaryBar(items(2, 0, 1)).map((s) => s.key), ["paid", "absent"]);
  });

  it("has no segments when everyone is at zero", () => {
    assert.deepEqual(statusSummaryBar(items(0, 0, 0)), []);
  });
});
