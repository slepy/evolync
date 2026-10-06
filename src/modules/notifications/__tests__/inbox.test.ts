import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { enUS } from "date-fns/locale";
import { groupInbox, inboxGroupKey, inboxTimeLabel, shortDay, shortDayRange } from "../utils/inbox";

const translate = (key: string, params?: Record<string, unknown>) =>
  params ? `${key}${JSON.stringify(params)}` : key;

const NOW = new Date(2026, 10, 15, 12, 0);
const at = (day: number, hour: number, minute = 0, month = 10, year = 2026) =>
  new Date(year, month, day, hour, minute);

describe("inboxGroupKey", () => {
  it("splits by calendar day, not by 24 hours", () => {
    assert.equal(inboxGroupKey(at(15, 0, 5), NOW), "today");
    assert.equal(inboxGroupKey(at(14, 23, 59), NOW), "yesterday");
    assert.equal(inboxGroupKey(at(14, 0, 1), NOW), "yesterday");
    assert.equal(inboxGroupKey(at(13, 23, 0), NOW), "earlier");
  });

  it("treats a clock-skewed future time as today", () => {
    assert.equal(inboxGroupKey(at(15, 13), NOW), "today");
  });
});

describe("groupInbox", () => {
  it("keeps TODAY / YESTERDAY / EARLIER order, skips empty groups and counts unread", () => {
    const items = [
      { id: "a", createdAt: at(15, 11), readAt: null },
      { id: "b", createdAt: at(15, 9), readAt: at(15, 10) },
      { id: "c", createdAt: at(10, 9), readAt: null },
    ];
    const groups = groupInbox(items, NOW);
    assert.deepEqual(
      groups.map((g) => [g.key, g.items.map((i) => i.id), g.unread]),
      [
        ["today", ["a", "b"], 1],
        ["earlier", ["c"], 1],
      ],
    );
  });

  it("returns nothing for an empty inbox", () => {
    assert.deepEqual(groupInbox([], NOW), []);
  });
});

describe("inboxTimeLabel", () => {
  const label = (d: Date) => inboxTimeLabel(d, NOW, translate, enUS);

  it("shows minutes, then hours today", () => {
    assert.equal(label(at(15, 11, 48)), 'notificationsMinutesAgo{"count":12}');
    assert.equal(label(at(15, 11, 59, 10)), 'notificationsMinutesAgo{"count":1}');
    assert.equal(label(at(15, 11, 0)), 'notificationsHoursAgo{"count":1}');
    assert.equal(label(at(15, 9, 0)), 'notificationsHoursAgo{"count":3}');
  });

  it("shows the clock time yesterday and the day earlier", () => {
    assert.equal(label(at(14, 18, 40)), "18:40");
    assert.equal(label(at(12, 9)), "12 Nov");
    assert.equal(label(at(12, 9, 0, 10, 2025)), "12 Nov 2025");
  });
});

describe("short days", () => {
  it("formats a day and a range like the boards", () => {
    assert.equal(shortDay(at(20, 0, 0, 11), NOW, enUS), "20 Dec");
    assert.equal(shortDayRange(at(1, 0), at(30, 0), NOW, enUS), "1–30 Nov");
    assert.equal(shortDayRange(at(28, 0, 0, 9), at(3, 0), NOW, enUS), "28 Oct – 3 Nov");
    assert.equal(shortDayRange(at(3, 0), at(3, 0), NOW, enUS), "3 Nov");
    assert.equal(shortDayRange(at(28, 0, 0, 11), at(3, 0, 0, 0, 2027), NOW, enUS), "28 Dec 2026 – 3 Jan 2027");
  });
});
