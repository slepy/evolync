import { formatDay } from "@/modules/trainings/components/format";

const DAY = { day: "numeric" } as const;
const DAY_MONTH = { day: "numeric", month: "short" } as const;
const FULL = { day: "numeric", month: "short", year: "numeric" } as const;

/**
 * Event date range ("YYYY-MM-DD" days) as on 10C: "22 Nov 2025",
 * "20–24 Nov 2025", "28 Nov – 3 Dec 2025", "29 Dec 2025 – 2 Jan 2026".
 */
export const formatEventDates = (startDate: string, endDate: string): string => {
  if (endDate <= startDate) return formatDay(startDate, FULL);
  const sameYear = startDate.slice(0, 4) === endDate.slice(0, 4);
  if (sameYear && startDate.slice(5, 7) === endDate.slice(5, 7)) {
    return `${formatDay(startDate, DAY)}–${formatDay(endDate, FULL)}`;
  }
  return `${formatDay(startDate, sameYear ? DAY_MONTH : FULL)} – ${formatDay(endDate, FULL)}`;
};
