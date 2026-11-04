import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  countSessions,
  countStatuses,
  dateLocaleTag,
  findSessionOnDay,
  formatSessionDate,
  formatSessionMonth,
  formatSessionShort,
  formatSessionTime,
  formatSessionTitle,
  groupSessionsByMonth,
  isSameDay,
  parseDayKey,
  sessionDateForDay,
  toDayKey,
  yesterdayKey,
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

describe("formatSessionTime", () => {
  it("formats the start time in 24h", () => {
    assert.equal(formatSessionTime(new Date(2026, 9, 2, 18, 0), "en-GB"), "18:00");
    assert.equal(formatSessionTime(new Date(2026, 9, 2, 9, 30), "pl-PL"), "09:30");
  });

  it("has no time for a session saved at midnight", () => {
    assert.equal(formatSessionTime(new Date(2026, 9, 2), "en-GB"), null);
  });
});

describe("formatSessionDate", () => {
  it("adds the year to the short day", () => {
    assert.equal(formatSessionDate(new Date(2026, 10, 4, 9, 0), "en-GB"), "Wed, 4 Nov 2026");
  });
});

describe("day keys", () => {
  it("round-trips a local day", () => {
    assert.equal(toDayKey(new Date(2026, 0, 5, 23, 59)), "2026-01-05");
    assert.deepEqual(parseDayKey("2026-01-05"), new Date(2026, 0, 5));
  });
  it("rejects malformed and impossible days", () => {
    assert.equal(parseDayKey("2026-1-5"), null);
    assert.equal(parseDayKey("2026-02-30"), null);
  });
  it("gives yesterday across a month and year boundary", () => {
    assert.equal(yesterdayKey(new Date(2026, 10, 4, 10)), "2026-11-03");
    assert.equal(yesterdayKey(new Date(2027, 0, 1, 0, 5)), "2026-12-31");
  });
});

describe("sessionDateForDay", () => {
  const now = new Date(2026, 10, 4, 18, 30);
  const utcDay = (date: Date) => date.toISOString().split("T")[0];
  it("saves today at UTC midnight of the local day", () => {
    assert.deepEqual(sessionDateForDay(null, now), new Date(Date.UTC(2026, 10, 4)));
    assert.deepEqual(sessionDateForDay("2026-11-04", now), new Date(Date.UTC(2026, 10, 4)));
  });
  it("saves a past day at UTC midnight of that day", () => {
    assert.deepEqual(sessionDateForDay("2026-10-30", now), new Date(Date.UTC(2026, 9, 30)));
  });
  it("keeps the picked day through sync, which stores the UTC day", () => {
    assert.equal(utcDay(sessionDateForDay("2026-10-30", now)), "2026-10-30");
    assert.equal(utcDay(sessionDateForDay(null, new Date(2026, 10, 4, 0, 30))), "2026-11-04");
  });
  it("shows on the picked local day east of UTC", { skip: new Date(2026, 9, 30).getTimezoneOffset() > 0 }, () => {
    assert.ok(isSameDay(sessionDateForDay("2026-10-30", now), new Date(2026, 9, 30, 12)));
  });
  it("never saves a future or invalid day", () => {
    assert.deepEqual(sessionDateForDay("2026-11-05", now), new Date(Date.UTC(2026, 10, 4)));
    assert.deepEqual(sessionDateForDay("soon", now), new Date(Date.UTC(2026, 10, 4)));
  });
});

describe("findSessionOnDay", () => {
  const sessions = [{ id: "a", sessionDate: day(2026, 11, 4) }, { id: "b", sessionDate: new Date(2026, 9, 30) }];
  it("finds the session of the same local day", () => {
    assert.equal(findSessionOnDay(sessions, new Date(2026, 9, 30, 12))?.id, "b");
    assert.equal(findSessionOnDay(sessions, new Date(2026, 10, 4))?.id, "a");
  });
  it("returns null for a free day", () => {
    assert.equal(findSessionOnDay(sessions, new Date(2026, 9, 31)), null);
  });
});
