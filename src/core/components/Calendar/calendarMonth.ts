import { timestampToDay } from "../NextUp/pickNextUp";

/**
 * Pure month model for the Calendar screen (boards 6 / 6A): the Monday-first
 * grid with multi-day event bars and dots, and the items of the selected day.
 * Days are "YYYY-MM-DD"; events and trainings store days as UTC-midnight
 * timestamps.
 */

export interface CalendarEventSource {
  id: string;
  name: string;
  typeId?: string;
  address?: string;
  startDate: Date;
  endDate: Date;
  status: string;
}

export interface CalendarTrainingSource {
  id: string;
  name: string;
  location?: string;
  schoolId?: string;
  seriesId?: string;
  date: Date;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  status: string;
}

export type CalendarFilter = "all" | "events" | "trainings";

/** Multi-day events drawn as bars under the day number. */
export const CALENDAR_LANES = 2;

export interface CalendarLaneSegment {
  /** Rounded on the event's real first / last day, square where it continues. */
  isStart: boolean;
  isEnd: boolean;
}

export interface CalendarDayCell {
  day: string;
  dayOfMonth: number;
  isToday: boolean;
  isSelected: boolean;
  /** One entry per lane; null = no bar in that lane on this day. */
  lanes: (CalendarLaneSegment | null)[];
  /** Single-day event (or a multi-day one that did not fit a lane). */
  hasEvent: boolean;
  /** A training that is not cancelled. */
  hasTraining: boolean;
  /** Items listed for this day (cancelled included). */
  count: number;
}

export type CalendarItem =
  | {
      kind: "event";
      id: string;
      title: string;
      typeId?: string;
      place?: string;
      startDay: string;
      endDay: string;
      /** 1-based day of a multi-day event ("Day 2/5"). */
      dayIndex: number;
      dayCount: number;
      cancelled: boolean;
    }
  | {
      kind: "training";
      id: string;
      title: string;
      location?: string;
      schoolId?: string;
      seriesId?: string;
      startTime: string;
      endTime: string;
      cancelled: boolean;
    };

const DAY_MS = 24 * 60 * 60 * 1000;

const dayOf = (year: number, month: number, dayOfMonth: number) =>
  timestampToDay(Date.UTC(year, month, dayOfMonth));

const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);

/** First and last day of a month as UTC-midnight timestamps (`month` is 0-based). */
export function monthRange(year: number, month: number): { from: number; to: number } {
  return { from: Date.UTC(year, month, 1), to: Date.UTC(year, month + 1, 0) };
}

/** The month `delta` months away, as { year, month (0-based) }. */
export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const date = new Date(Date.UTC(year, month + delta, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
}

const isCancelled = (status: string) => status === "cancelled";

const showsEvents = (filter: CalendarFilter) => filter !== "trainings";
const showsTrainings = (filter: CalendarFilter) => filter !== "events";

interface SpannedEvent {
  event: CalendarEventSource;
  start: string;
  end: string;
}

const span = (event: CalendarEventSource): SpannedEvent => ({
  event,
  start: timestampToDay(event.startDate),
  end: timestampToDay(event.endDate),
});

/**
 * Lane per active multi-day event, first come first served by start day.
 * Events that overlap both lanes get none (they show as a dot instead).
 */
export function assignLanes(events: CalendarEventSource[]): Map<string, number> {
  const multi = events
    .filter((event) => !isCancelled(event.status))
    .map(span)
    .filter(({ start, end }) => end > start)
    .sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end));
  const lanes: SpannedEvent[][] = Array.from({ length: CALENDAR_LANES }, () => []);
  const result = new Map<string, number>();
  for (const item of multi) {
    const lane = lanes.findIndex((taken) => taken.every((o) => o.end < item.start || o.start > item.end));
    if (lane === -1) continue;
    lanes[lane].push(item);
    result.set(item.event.id, lane);
  }
  return result;
}

/**
 * Month grid cells, Monday first: `null` pads the first and last week.
 * `month` is 0-based.
 */
export function buildMonthCells(
  year: number,
  month: number,
  events: CalendarEventSource[],
  trainings: CalendarTrainingSource[],
  filter: CalendarFilter,
  today: string,
  selected: string,
): (CalendarDayCell | null)[] {
  const visibleEvents = showsEvents(filter) ? events.map(span) : [];
  const visibleTrainings = showsTrainings(filter) ? trainings : [];
  const lanes = assignLanes(visibleEvents.map(({ event }) => event));

  const leading = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (CalendarDayCell | null)[] = Array(leading).fill(null);

  for (let d = 1; d <= daysInMonth; d++) {
    const day = dayOf(year, month, d);
    const dayEvents = visibleEvents.filter(({ start, end }) => start <= day && day <= end);
    const dayTrainings = visibleTrainings.filter((training) => timestampToDay(training.date) === day);

    const cellLanes: (CalendarLaneSegment | null)[] = Array(CALENDAR_LANES).fill(null);
    let hasEvent = false;
    for (const { event, start, end } of dayEvents) {
      if (isCancelled(event.status)) continue;
      const lane = lanes.get(event.id);
      if (lane === undefined) {
        hasEvent = true;
      } else {
        cellLanes[lane] = { isStart: day === start, isEnd: day === end };
      }
    }

    cells.push({
      day,
      dayOfMonth: d,
      isToday: day === today,
      isSelected: day === selected,
      lanes: cellLanes,
      hasEvent,
      hasTraining: dayTrainings.some((training) => !isCancelled(training.status)),
      count: dayEvents.length + dayTrainings.length,
    });
  }

  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** Everything on `day`: events first (by start), then trainings by start time. */
export function itemsForDay(
  day: string,
  events: CalendarEventSource[],
  trainings: CalendarTrainingSource[],
  filter: CalendarFilter,
): CalendarItem[] {
  const eventItems: CalendarItem[] = showsEvents(filter)
    ? events
        .map(span)
        .filter(({ start, end }) => start <= day && day <= end)
        .sort((a, b) => a.start.localeCompare(b.start) || a.event.name.localeCompare(b.event.name))
        .map(({ event, start, end }) => ({
          kind: "event" as const,
          id: event.id,
          title: event.name,
          typeId: event.typeId || undefined,
          place: event.address || undefined,
          startDay: start,
          endDay: end,
          dayIndex: daysBetween(start, day) + 1,
          dayCount: daysBetween(start, end) + 1,
          cancelled: isCancelled(event.status),
        }))
    : [];

  const trainingItems: CalendarItem[] = showsTrainings(filter)
    ? trainings
        .filter((training) => timestampToDay(training.date) === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime) || a.name.localeCompare(b.name))
        .map((training) => ({
          kind: "training" as const,
          id: training.id,
          title: training.name,
          location: training.location || undefined,
          schoolId: training.schoolId || undefined,
          seriesId: training.seriesId || undefined,
          startTime: training.startTime,
          endTime: training.endTime,
          cancelled: isCancelled(training.status),
        }))
    : [];

  return [...eventItems, ...trainingItems];
}

/**
 * Meta line of an event row: "Camp · Zakopane", or for a multi-day event
 * "20 Nov – 24 Nov · Camp · Zakopane". Without a type a single-day row keeps
 * the generic kind label (`fallback`, "Event").
 */
export function eventRowMeta(parts: { dateRange?: string; typeName?: string; place?: string; fallback: string }): string {
  const { dateRange, typeName, place, fallback } = parts;
  const kind = typeName || (dateRange ? undefined : fallback);
  return [dateRange, kind, place].filter(Boolean).join(" · ");
}

/** "↻ Weekly" / "↻ Monthly"; a series mixing both is just "recurring". */
export type SeriesFrequencyLabel = "weekly" | "monthly" | "recurring";

/** Frequency label from a series' stored rules JSON. */
export function seriesFrequencyLabel(rulesJson: string | undefined): SeriesFrequencyLabel {
  let frequencies: unknown[] = [];
  try {
    const rules = JSON.parse(rulesJson ?? "[]");
    frequencies = Array.isArray(rules) ? rules.map((rule) => rule?.frequency) : [];
  } catch {
    frequencies = [];
  }
  const unique = new Set(frequencies);
  if (unique.size === 1 && unique.has("weekly")) return "weekly";
  if (unique.size === 1 && unique.has("monthly")) return "monthly";
  return "recurring";
}

/**
 * Day to select in a month: `preferred` when it is in the month, else
 * `today` when it is, else the 1st.
 */
export function defaultSelectedDay(year: number, month: number, today: string, preferred?: string): string {
  const prefix = dayOf(year, month, 1).slice(0, 7);
  if (preferred?.startsWith(prefix)) return preferred;
  if (today.startsWith(prefix)) return today;
  return dayOf(year, month, 1);
}
