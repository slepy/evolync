import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  pickNextUp,
  type NextUpEventSource,
  type NextUpTrainingSource,
} from "@/core/components/HeroCard/nextUp";

const day = (value: string) => new Date(`${value}T00:00:00Z`);

const event = (id: string, start: string, end = start, address?: string): NextUpEventSource => ({
  id,
  name: `Event ${id}`,
  address,
  startDate: day(start),
  endDate: day(end),
});

const training = (
  id: string,
  date: string,
  startTime = "18:00",
  status = "active",
): NextUpTrainingSource => ({
  id,
  name: `Training ${id}`,
  location: "ul. Puławska 18",
  date: day(date),
  startTime,
  endTime: "19:30",
  status,
});

const TODAY = "2026-10-04";

describe("pickNextUp", () => {
  it("returns null when nothing is planned", () => {
    assert.equal(pickNextUp([], [], TODAY), null);
  });

  it("ignores past items", () => {
    const result = pickNextUp([event("e1", "2026-10-01")], [training("t1", "2026-10-03")], TODAY);
    assert.equal(result, null);
  });

  it("picks the nearest day and lists everything on it, events first", () => {
    const result = pickNextUp(
      [event("e1", "2026-10-06", "2026-10-06", "Warszawa Mokotów"), event("e2", "2026-10-09")],
      [training("t2", "2026-10-06", "18:00"), training("t1", "2026-10-06", "16:00"), training("t3", "2026-10-07")],
      TODAY,
    );
    assert.equal(result?.day, "2026-10-06");
    assert.deepEqual(
      result?.items.map((item) => item.id),
      ["e1", "t1", "t2"],
    );
    assert.equal(result?.items[0].place, "Warszawa Mokotów");
  });

  it("counts an ongoing multi-day event for today", () => {
    const result = pickNextUp([event("camp", "2026-10-02", "2026-10-05")], [training("t1", TODAY)], TODAY);
    assert.equal(result?.day, TODAY);
    assert.deepEqual(
      result?.items.map((item) => item.id),
      ["camp", "t1"],
    );
  });

  it("skips cancelled trainings", () => {
    const result = pickNextUp([], [training("t1", TODAY, "10:00", "cancelled"), training("t2", "2026-10-05")], TODAY);
    assert.equal(result?.day, "2026-10-05");
    assert.deepEqual(
      result?.items.map((item) => item.id),
      ["t2"],
    );
  });

  it("keeps training times on training items", () => {
    const result = pickNextUp([], [training("t1", TODAY, "16:00")], TODAY);
    const item = result?.items[0];
    assert.equal(item?.kind, "training");
    if (item?.kind === "training") {
      assert.equal(item.startTime, "16:00");
      assert.equal(item.endTime, "19:30");
    }
  });
});

describe("addDays", () => {
  it("crosses month boundaries", () => {
    assert.equal(addDays("2026-10-31", 1), "2026-11-01");
  });
});
