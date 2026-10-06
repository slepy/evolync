import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  countSessions,
  countStatuses,
  dateLocaleTag,
  formatSessionMonth,
  formatSessionShort,
  formatSessionTitle,
  groupSessionsByMonth,
  isSameDay,
} from "@/modules/attendance/sessionList";

const day = (y: number, m: number, d: number) => new Date(y, m - 1, d, 18, 30);

describe("countSessions", () => {
  it("counts present and total per session", () => {
    const counts = countSessions([
      { trainingSessionId: "a", status: "present" },
      { trainingSessionId: "a", status: "absent" },
      { trainingSessionId: "a", status: "excused" },
      { trainingSessionId: "b", status: "present" },
    ]);
    assert.deepEqual(counts, { a: { present: 1, total: 3 }, b: { present: 1, total: 1 } });
  });
});

describe("groupSessionsByMonth", () => {
  it("groups consecutive sessions of a month, keeping their order", () => {
    const sessions = [
      { id: "1", sessionDate: day(2026, 10, 2) },
      { id: "2", sessionDate: day(2026, 9, 30) },
      { id: "3", sessionDate: day(2026, 9, 25) },
    ];
    const groups = groupSessionsByMonth(sessions);
    assert.deepEqual(
      groups.map((g) => [g.key, g.sessions.map((s) => s.id)]),
      [
        ["2026-10", ["1"]],
        ["2026-09", ["2", "3"]],
      ],
    );
  });

  it("returns no groups for no sessions", () => {
    assert.deepEqual(groupSessionsByMonth([]), []);
  });
});

describe("countStatuses", () => {
  it("counts every status, zeros included", () => {
    assert.deepEqual(countStatuses([{ status: "present" }, { status: "present" }, { status: "excused" }]), {
      present: 2,
      absent: 0,
      excused: 1,
    });
  });
});

describe("isSameDay", () => {
  it("compares the local calendar day", () => {
    assert.equal(isSameDay(new Date(2026, 9, 4, 23, 0), new Date(2026, 9, 4, 6, 0)), true);
    assert.equal(isSameDay(new Date(2026, 9, 3, 23, 0), new Date(2026, 9, 4, 6, 0)), false);
  });
});

describe("session date labels", () => {
  const en = dateLocaleTag("en");

  it("formats day-first English as on the boards", () => {
    assert.equal(formatSessionTitle(day(2026, 10, 2), en), "Friday, 2 October");
    assert.equal(formatSessionShort(day(2026, 10, 2), en), "Fri, 2 Oct");
    assert.equal(formatSessionMonth(day(2026, 10, 2), en), "October 2026");
    assert.equal(formatSessionShort(day(2026, 9, 30), en), "Wed, 30 Sep");
  });

  it("capitalizes the Polish weekday", () => {
    assert.match(formatSessionTitle(day(2026, 10, 2), dateLocaleTag("pl")), /^Piątek, 2 października$/);
  });
});
