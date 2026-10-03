import type {
  SeriesOccurrence,
  SeriesRule,
  WeekOfMonth,
} from "./dto";
import { MAX_SERIES_MONTHS } from "./enums";

/**
 * Pure day/time helpers. A training "day" is a "YYYY-MM-DD" string in DTOs
 * and the UTC-midnight timestamp of that day in the database (the same day
 * convention as attendance). Times are "HH:mm" wall-clock strings, so DST
 * never shifts them.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export const isValidDay = (day: string): boolean =>
  DAY_RE.test(day) && timestampToDay(dayToTimestamp(day)) === day;

export const dayToTimestamp = (day: string): number => {
  const [y, m, d] = day.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};

export const timestampToDay = (timestamp: number | Date): string =>
  new Date(timestamp).toISOString().slice(0, 10);

/** The device-local calendar day, as "YYYY-MM-DD". */
export const localToday = (now: Date = new Date()): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

export const addDays = (day: string, days: number): string =>
  timestampToDay(dayToTimestamp(day) + days * DAY_MS);

/** Same day-of-month `months` later, clamped to the month's last day. */
export const addMonths = (day: string, months: number): string => {
  const [y, m, d] = day.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return timestampToDay(target);
};

/** Latest allowed Until for a series starting on `startDay`. */
export const maxSeriesEnd = (startDay: string): string =>
  addMonths(startDay, MAX_SERIES_MONTHS);

/** "HH:mm" strings compare correctly as text. */
export const isTimeRangeValid = (startTime: string, endTime: string): boolean =>
  TIME_RE.test(startTime) && TIME_RE.test(endTime) && endTime > startTime;

/** Does `timestamp`'s day fall on the given nth (or last) weekday of its month? */
const matchesWeekOfMonth = (date: Date, weekOfMonth: WeekOfMonth): boolean => {
  const dayOfMonth = date.getUTCDate();
  if (weekOfMonth === -1) {
    const daysInMonth = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
    ).getUTCDate();
    return dayOfMonth + 7 > daysInMonth;
  }
  return Math.ceil(dayOfMonth / 7) === weekOfMonth;
};

/**
 * Expands series rules into concrete occurrences between two days
 * (inclusive). Duplicates (same day + start time) are dropped and the
 * output is sorted by day, then start time.
 */
export const expandSeriesRules = (
  rules: SeriesRule[],
  startDay: string,
  endDay: string,
): SeriesOccurrence[] => {
  const start = dayToTimestamp(startDay);
  const end = dayToTimestamp(endDay);
  const seen = new Set<string>();
  const out: SeriesOccurrence[] = [];

  for (let ts = start; ts <= end; ts += DAY_MS) {
    const date = new Date(ts);
    const weekday = date.getUTCDay();
    for (const rule of rules) {
      if (rule.weekday !== weekday) continue;
      if (
        rule.frequency === "monthly" &&
        (rule.weekOfMonth === undefined ||
          !matchesWeekOfMonth(date, rule.weekOfMonth))
      ) {
        continue;
      }
      const day = timestampToDay(ts);
      const key = `${day} ${rule.startTime}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ day, startTime: rule.startTime, endTime: rule.endTime });
    }
  }

  return out.sort((a, b) =>
    a.day === b.day
      ? a.startTime.localeCompare(b.startTime)
      : a.day.localeCompare(b.day),
  );
};

/** Parses a stored JSON string array, tolerating bad data. */
export const parseJsonArray = <T = string>(value: string | undefined): T[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
};
