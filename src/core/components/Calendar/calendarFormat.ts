import { dayToTimestamp } from "../NextUp/pickNextUp";

/**
 * Date labels for the Calendar screen. Days are "YYYY-MM-DD" (UTC midnight),
 * formatted in UTC so the device time zone never shifts them. `locale` is
 * the app language ("en" / "pl").
 */

const intlLocale = (locale: string) => (locale === "pl" ? "pl-PL" : "en-GB");

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

/** "November 2025" / "Listopad 2025". `month` is 0-based. */
export function formatMonth(year: number, month: number, locale: string): string {
  return capitalize(
    new Date(Date.UTC(year, month, 1)).toLocaleDateString(intlLocale(locale), {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }),
  );
}

/** Monday-first short weekday names, upper case without dots: "MON"… / "PON"…. */
export function weekdayLabels(locale: string): string[] {
  // 2024-01-01 is a Monday
  return Array.from({ length: 7 }, (_, i) =>
    new Date(Date.UTC(2024, 0, 1 + i))
      .toLocaleDateString(intlLocale(locale), { weekday: "short", timeZone: "UTC" })
      .replace(".", "")
      .toUpperCase(),
  );
}

/** "Saturday, 22 Nov" / "Sobota, 22 lis". */
export function formatDayTitle(day: string, locale: string): string {
  const weekday = new Date(dayToTimestamp(day)).toLocaleDateString(intlLocale(locale), {
    weekday: "long",
    timeZone: "UTC",
  });
  return `${capitalize(weekday)}, ${formatShortDay(day, locale)}`;
}

/** "22 Nov" / "22 lis". */
export function formatShortDay(day: string, locale: string): string {
  return new Date(dayToTimestamp(day)).toLocaleDateString(intlLocale(locale), {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}
