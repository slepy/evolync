import type { PaymentStatus } from "@/database/models/PaymentRecord";

/** "YYYY-MM-DD" */
export type DayKey = string;

export type PeriodKind = "month" | "week" | "year" | "custom";

/** Presets of 14D; "custom" lets the user pick START / END (14D1). */
export type PeriodPreset = "this_month" | "this_week" | "this_year" | "custom";

/** BCP-47 tag of the app language; day-first English, as on the boards. */
export const dateLocaleTag = (language: string): string => (language === "pl" ? "pl-PL" : "en-GB");

const pad = (n: number) => String(n).padStart(2, "0");

/** Stored period dates are UTC midnight of their day. */
export const storedDayKey = (date: Date): DayKey => date.toISOString().slice(0, 10);

/** The local calendar day of a date (today, picker values). */
export const localDayKey = (date: Date): DayKey =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parts = (day: DayKey) => ({ y: Number(day.slice(0, 4)), m: Number(day.slice(5, 7)), d: Number(day.slice(8, 10)) });
const utc = (day: DayKey) => {
  const { y, m, d } = parts(day);
  return new Date(Date.UTC(y, m - 1, d));
};
const lastDayOfMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
const addDays = (day: DayKey, days: number): DayKey => {
  const date = utc(day);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

/** Month, Monday–Sunday week, year, or any other range. */
export function periodKind(start: DayKey, end: DayKey): PeriodKind {
  const s = parts(start);
  const e = parts(end);
  if (s.y === e.y && s.m === 1 && s.d === 1 && e.m === 12 && e.d === 31) return "year";
  if (s.y === e.y && s.m === e.m && s.d === 1 && e.d === lastDayOfMonth(e.y, e.m)) return "month";
  if (utc(start).getUTCDay() === 1 && addDays(start, 6) === end) return "week";
  return "custom";
}

const fmt = (day: DayKey, locale: string, options: Intl.DateTimeFormatOptions) =>
  utc(day).toLocaleDateString(locale, { ...options, timeZone: "UTC" });

const capitalize = (text: string): string => text.charAt(0).toLocaleUpperCase() + text.slice(1);

/**
 * Day-first range: "1 – 31 Oct", "29 Sep – 5 Oct", with `withYear`
 * "14 – 27 Jul 2026"; across years always "29 Dec 2025 – 2 Jan 2026".
 */
export function formatPeriodRange(start: DayKey, end: DayKey, locale: string, withYear = true): string {
  const s = parts(start);
  const e = parts(end);
  // en-GB abbreviates September as "Sept"; the boards use the three-letter "Sep".
  const monthLocale = locale === "en-GB" ? "en-US" : locale;
  const month = (day: DayKey) => fmt(day, monthLocale, { month: "short" }).replace(/\.$/, "");
  if (s.y !== e.y) return `${s.d} ${month(start)} ${s.y} – ${e.d} ${month(end)} ${e.y}`;
  const year = withYear ? ` ${e.y}` : "";
  if (s.m === e.m) return `${s.d} – ${e.d} ${month(end)}${year}`;
  return `${s.d} ${month(start)} – ${e.d} ${month(end)}${year}`;
}

/** Period as shown on 14A / 14B: title, its kind, and the range without the year. */
export function describePeriod(start: DayKey, end: DayKey, locale: string) {
  const kind = periodKind(start, end);
  const title =
    kind === "month"
      ? capitalize(fmt(start, locale, { month: "long", year: "numeric" }))
      : kind === "year"
        ? start.slice(0, 4)
        : formatPeriodRange(start, end, locale);
  return { kind, title, range: formatPeriodRange(start, end, locale, false) };
}

/** Today falls inside the period (14A "CURRENT"). */
export const isCurrentPeriod = (start: DayKey, end: DayKey, today: DayKey): boolean => start <= today && today <= end;

/** Start and end of a preset around `today` (weeks start on Monday). */
export function periodPresetRange(preset: Exclude<PeriodPreset, "custom">, today: DayKey): { start: DayKey; end: DayKey } {
  const { y, m } = parts(today);
  if (preset === "this_year") return { start: `${y}-01-01`, end: `${y}-12-31` };
  if (preset === "this_month") return { start: `${y}-${pad(m)}-01`, end: `${y}-${pad(m)}-${pad(lastDayOfMonth(y, m))}` };
  const weekday = utc(today).getUTCDay();
  const start = addDays(today, -((weekday + 6) % 7));
  return { start, end: addDays(start, 6) };
}

/** "150", "150.50" */
export const formatAmount = (amount: number): string =>
  Number.isInteger(amount) ? String(amount) : amount.toFixed(2);

export interface CurrencyAmount {
  currency: string;
  amount: number;
}

/** Sums per currency for each status (14B1 COLLECTED / PENDING / CANCELLED), currencies in first-seen order. */
export function amountsByStatus(
  items: ReadonlyArray<{ status: PaymentStatus; amount: number; currency: string }>,
): Record<PaymentStatus, CurrencyAmount[]> {
  const result: Record<PaymentStatus, CurrencyAmount[]> = { paid: [], pending: [], cancelled: [] };
  for (const item of items) {
    const list = result[item.status];
    const entry = list.find((e) => e.currency === item.currency);
    if (entry) entry.amount += item.amount;
    else list.push({ currency: item.currency, amount: item.amount });
  }
  return result;
}

const PAYMENT_STATUS_CYCLE: PaymentStatus[] = ["pending", "paid", "cancelled"];

/** The status a tap on the 14B status button moves a payment to: Pending → Paid → Cancelled. */
export const nextPaymentStatus = (status: PaymentStatus): PaymentStatus =>
  PAYMENT_STATUS_CYCLE[(PAYMENT_STATUS_CYCLE.indexOf(status) + 1) % PAYMENT_STATUS_CYCLE.length];

/** Counts of each status in an edited list (14B summary). */
export function countPaymentStatuses(items: ReadonlyArray<{ status: PaymentStatus }>): Record<PaymentStatus, number> {
  const counts: Record<PaymentStatus, number> = { paid: 0, pending: 0, cancelled: 0 };
  for (const item of items) counts[item.status] += 1;
  return counts;
}

/** Paid and total count per period id from the school's payment records (14A chip). */
export function countPeriods(
  records: ReadonlyArray<{ paymentCycleId: string; status: PaymentStatus }>,
): Record<string, { paid: number; total: number }> {
  const counts: Record<string, { paid: number; total: number }> = {};
  for (const record of records) {
    const c = (counts[record.paymentCycleId] ??= { paid: 0, total: 0 });
    c.total += 1;
    if (record.status === "paid") c.paid += 1;
  }
  return counts;
}
