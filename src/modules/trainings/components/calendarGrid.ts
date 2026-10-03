import { timestampToDay } from "../types/helpers";

export interface CalendarCell {
  day: string; // "YYYY-MM-DD"
  disabled: boolean;
}

/**
 * Monday-first month grid (rows of 7, `null` padding); days before
 * `minDay` are disabled.
 */
export const buildMonthGrid = (year: number, month: number, minDay: string): (CalendarCell | null)[][] => {
  const leading = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (CalendarCell | null)[] = Array(leading).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const day = timestampToDay(Date.UTC(year, month, d));
    cells.push({ day, disabled: day < minDay });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (CalendarCell | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
};

/**
 * Toggles a day in a multi-date selection. Past days are ignored; with
 * `maxDates = 1` a new day replaces the selected one.
 */
export const toggleDay = (selected: string[], day: string, minDay: string, maxDates?: number): string[] => {
  if (day < minDay) return selected;
  if (selected.includes(day)) return selected.filter((d) => d !== day);
  if (maxDates === 1) return [day];
  if (maxDates && selected.length >= maxDates) return selected;
  return [...selected, day].sort();
};
