import { formatDay, localeTag } from "@/modules/trainings/components/format";
import { dayToTimestamp } from "@/modules/trainings/types/helpers";

const DAY_MONTH = { day: "numeric", month: "short" } as const;
const FULL = { day: "numeric", month: "short", year: "numeric" } as const;

/** "24 Nov 2025" with the day replaced by "20–24", in the locale's own order ("Nov 20–24, 2025" in English). */
const formatSameMonth = (startDate: string, endDate: string): string => {
  const range = `${Number(startDate.slice(8))}–${Number(endDate.slice(8))}`;
  const format = new Intl.DateTimeFormat(localeTag(), { ...FULL, timeZone: "UTC" });
  if (typeof format.formatToParts !== "function") return `${range} ${formatDay(endDate, { month: "short", year: "numeric" })}`;
  return format
    .formatToParts(new Date(dayToTimestamp(endDate)))
    .map((part) => (part.type === "day" ? range : part.value))
    .join("");
};

/**
 * Event date range ("YYYY-MM-DD" days) as on 10C: "22 Nov 2025",
 * "20–24 Nov 2025", "28 Nov – 3 Dec 2025", "29 Dec 2025 – 2 Jan 2026"
 * (each in the app language's date order).
 */
export const formatEventDates = (startDate: string, endDate: string): string => {
  if (endDate <= startDate) return formatDay(startDate, FULL);
  const sameYear = startDate.slice(0, 4) === endDate.slice(0, 4);
  if (sameYear && startDate.slice(5, 7) === endDate.slice(5, 7)) return formatSameMonth(startDate, endDate);
  return `${formatDay(startDate, sameYear ? DAY_MONTH : FULL)} – ${formatDay(endDate, FULL)}`;
};
