import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  amountsByStatus,
  countPaymentStatuses,
  countPeriods,
  currentPeriodsFirst,
  dateLocaleTag,
  describePeriod,
  formatAmount,
  formatCurrencyAmounts,
  formatPeriodDay,
  formatPeriodRange,
  isCurrentPeriod,
  localDayKey,
  memberPaymentAmount,
  nextPaymentStatus,
  parseAmount,
  periodKind,
  periodOwnAmount,
  periodPresetRange,
  storedDayKey,
} from "@/modules/payments/paymentPeriod";

const en = dateLocaleTag("en");

describe("periodKind", () => {
  it("recognizes a month, a year, a Monday week and anything else", () => {
    assert.equal(periodKind("2026-10-01", "2026-10-31"), "month");
    assert.equal(periodKind("2026-02-01", "2026-02-28"), "month");
    assert.equal(periodKind("2026-01-01", "2026-12-31"), "year");
    assert.equal(periodKind("2026-09-28", "2026-10-04"), "week");
    assert.equal(periodKind("2026-07-14", "2026-07-27"), "custom");
    assert.equal(periodKind("2026-10-01", "2026-10-30"), "custom");
  });
});

describe("formatPeriodRange", () => {
  it("writes day-first ranges", () => {
    assert.equal(formatPeriodRange("2026-07-14", "2026-07-27", en), "14 – 27 Jul 2026");
    assert.equal(formatPeriodRange("2026-10-01", "2026-10-31", en, false), "1 – 31 Oct");
    assert.equal(formatPeriodRange("2026-09-28", "2026-10-04", en), "28 Sep – 4 Oct 2026");
    assert.equal(formatPeriodRange("2025-12-29", "2026-01-02", en, false), "29 Dec 2025 – 2 Jan 2026");
  });
});

describe("formatPeriodDay", () => {
  it("writes one day-first date", () => {
    assert.equal(formatPeriodDay("2026-07-14", en), "14 Jul 2026");
  });
});

describe("describePeriod", () => {
  it("titles a month by its name and a custom range by its dates", () => {
    assert.deepEqual(describePeriod("2026-10-01", "2026-10-31", en), {
      kind: "month",
      title: "October 2026",
      range: "1 – 31 Oct",
    });
    assert.equal(describePeriod("2026-07-14", "2026-07-27", en).title, "14 – 27 Jul 2026");
    assert.equal(describePeriod("2026-01-01", "2026-12-31", en).title, "2026");
  });

  it("capitalizes the Polish month", () => {
    assert.equal(describePeriod("2026-10-01", "2026-10-31", dateLocaleTag("pl")).title, "Październik 2026");
  });
});

describe("isCurrentPeriod", () => {
  it("includes both ends", () => {
    assert.equal(isCurrentPeriod("2026-10-01", "2026-10-31", "2026-10-31"), true);
    assert.equal(isCurrentPeriod("2026-10-01", "2026-10-31", "2026-11-01"), false);
  });
});

describe("currentPeriodsFirst", () => {
  const range = (p: { start: string; end: string }) => p;

  it("puts current periods on top and keeps the order of both groups", () => {
    const periods = [
      { id: "nov", start: "2026-11-01", end: "2026-11-30" },
      { id: "oct", start: "2026-10-01", end: "2026-10-31" },
      { id: "sep", start: "2026-09-01", end: "2026-09-30" },
      { id: "year", start: "2026-01-01", end: "2026-12-31" },
      { id: "2025", start: "2025-01-01", end: "2025-12-31" },
    ];
    assert.deepEqual(
      currentPeriodsFirst(periods, range, "2026-10-21").map((p) => p.id),
      ["oct", "year", "nov", "sep", "2025"],
    );
  });

  it("leaves a list without a current period unchanged", () => {
    const periods = [
      { id: "sep", start: "2026-09-01", end: "2026-09-30" },
      { id: "aug", start: "2026-08-01", end: "2026-08-31" },
    ];
    assert.deepEqual(currentPeriodsFirst(periods, range, "2026-10-21"), periods);
  });
});

describe("periodPresetRange", () => {
  it("builds this month, week (Monday first) and year", () => {
    assert.deepEqual(periodPresetRange("this_month", "2026-02-14"), { start: "2026-02-01", end: "2026-02-28" });
    assert.deepEqual(periodPresetRange("this_week", "2026-10-04"), { start: "2026-09-28", end: "2026-10-04" });
    assert.deepEqual(periodPresetRange("this_week", "2026-09-28"), { start: "2026-09-28", end: "2026-10-04" });
    assert.deepEqual(periodPresetRange("this_year", "2026-10-04"), { start: "2026-01-01", end: "2026-12-31" });
  });
});

describe("day keys", () => {
  it("reads stored dates in UTC and local dates locally", () => {
    assert.equal(storedDayKey(new Date("2026-10-01")), "2026-10-01");
    assert.equal(localDayKey(new Date(2026, 9, 1, 0, 30)), "2026-10-01");
  });
});

describe("amounts and counts", () => {
  const items = [
    { status: "paid" as const, amount: 150, currency: "PLN" },
    { status: "paid" as const, amount: 40, currency: "EUR" },
    { status: "paid" as const, amount: 150, currency: "PLN" },
    { status: "pending" as const, amount: 120.5, currency: "PLN" },
  ];

  it("sums per currency for each status", () => {
    assert.deepEqual(amountsByStatus(items), {
      paid: [
        { currency: "PLN", amount: 300 },
        { currency: "EUR", amount: 40 },
      ],
      pending: [{ currency: "PLN", amount: 120.5 }],
      cancelled: [],
    });
  });

  it("counts statuses and periods", () => {
    assert.deepEqual(countPaymentStatuses(items), { paid: 3, pending: 1, cancelled: 0 });
    assert.deepEqual(
      countPeriods([
        { paymentCycleId: "a", status: "paid" },
        { paymentCycleId: "a", status: "cancelled" },
      ]),
      { a: { paid: 1, total: 2 } },
    );
  });

  it("formats whole and fractional amounts", () => {
    assert.equal(formatAmount(150), "150");
    assert.equal(formatAmount(120.5), "120.50");
  });
});

describe("nextPaymentStatus", () => {
  it("cycles Pending → Paid → Cancelled → Pending", () => {
    assert.equal(nextPaymentStatus("pending"), "paid");
    assert.equal(nextPaymentStatus("paid"), "cancelled");
    assert.equal(nextPaymentStatus("cancelled"), "pending");
  });
});

describe("parseAmount", () => {
  it("accepts whole and decimal amounts with a dot or comma", () => {
    assert.equal(parseAmount("120"), 120);
    assert.equal(parseAmount(" 120,5 "), 120.5);
    assert.equal(parseAmount("0"), 0);
  });

  it("rejects empty, negative, non-numeric and over-precise values", () => {
    for (const text of ["", "-5", "abc", "1.234", "1e3"]) assert.equal(parseAmount(text), null, text);
  });
});

describe("memberPaymentAmount", () => {
  const school = { amount: 200, currency: "PLN" };

  it("uses the school default for a member without an own amount", () => {
    assert.deepEqual(memberPaymentAmount({}, school), school);
    assert.deepEqual(memberPaymentAmount({ paymentAmount: null, paymentCurrency: null }, school), school);
  });

  it("uses the member's own amount, zero included", () => {
    assert.deepEqual(memberPaymentAmount({ paymentAmount: 100, paymentCurrency: "PLN" }, school), { amount: 100, currency: "PLN" });
    assert.deepEqual(memberPaymentAmount({ paymentAmount: 0, paymentCurrency: "EUR" }, school), { amount: 0, currency: "EUR" });
  });

  it("uses the period's own amount for everyone", () => {
    const period = { amount: 50, currency: "EUR" };
    assert.deepEqual(memberPaymentAmount({ paymentAmount: 100, paymentCurrency: "PLN" }, school, period), period);
    assert.deepEqual(memberPaymentAmount({}, school, period), period);
  });
});

describe("periodOwnAmount", () => {
  it("is the period's amount only when both amount and currency are set", () => {
    assert.deepEqual(periodOwnAmount({ amount: 0, currency: "EUR" }), { amount: 0, currency: "EUR" });
    assert.equal(periodOwnAmount({}), undefined);
    assert.equal(periodOwnAmount({ amount: null, currency: null }), undefined);
    assert.equal(periodOwnAmount({ amount: 50 }), undefined);
  });
});

describe("formatCurrencyAmounts", () => {
  it("joins amounts per currency with a middle dot", () => {
    assert.equal(formatCurrencyAmounts([{ amount: 150, currency: "PLN" }]), "150 PLN");
    assert.equal(
      formatCurrencyAmounts([
        { amount: 150, currency: "PLN" },
        { amount: 20.5, currency: "EUR" },
      ]),
      "150 PLN · 20.50 EUR",
    );
    assert.equal(formatCurrencyAmounts([]), "");
  });
});
