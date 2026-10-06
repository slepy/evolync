import { dayToTimestamp } from "../types/helpers";

/** BCP-47 tag for the active app language. */
export const localeTag = (): string => (t("locale") === "pl" ? "pl-PL" : "en-US");

/** Formats a "YYYY-MM-DD" day; days are UTC-midnight, so format in UTC. */
export const formatDay = (
  day: string,
  options: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" },
): string => new Date(dayToTimestamp(day)).toLocaleDateString(localeTag(), { ...options, timeZone: "UTC" });

export const formatDayLong = (day: string): string =>
  formatDay(day, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export const formatMonth = (year: number, month: number): string =>
  new Date(Date.UTC(year, month, 1)).toLocaleDateString(localeTag(), {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

/** Monday-first weekday order for pickers and calendars. */
export const WEEKDAYS_MONDAY_FIRST = [1, 2, 3, 4, 5, 6, 0] as const;

export const weekdayShort = (weekday: number): string => t(`trainingsWeekdayShort${weekday}`);
