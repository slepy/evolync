/**
 * Pure "next up" selection for the hero header: the nearest day that has an
 * active event or training, and everything on that day. Days are
 * "YYYY-MM-DD"; events and trainings store days as UTC-midnight timestamps.
 */

export interface NextUpEventSource {
  id: string;
  name: string;
  address?: string;
  startDate: Date;
  endDate: Date;
}

export interface NextUpTrainingSource {
  id: string;
  name: string;
  location?: string;
  date: Date;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  status: string;
}

export type NextUpItem =
  | { kind: "event"; id: string; title: string; place?: string }
  | {
      kind: "training";
      id: string;
      title: string;
      place?: string;
      startTime: string;
      endTime: string;
    };

export interface NextUp {
  day: string; // "YYYY-MM-DD"
  items: NextUpItem[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

export const timestampToDay = (timestamp: number | Date): string =>
  new Date(timestamp).toISOString().slice(0, 10);

export const dayToTimestamp = (day: string): number => {
  const [y, m, d] = day.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};

/** The device-local calendar day, as "YYYY-MM-DD". */
export const localToday = (now: Date = new Date()): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

export const addDays = (day: string, days: number): string =>
  timestampToDay(dayToTimestamp(day) + days * DAY_MS);

/**
 * Picks the nearest day (today or later) with something on it. An event
 * covers every day from its start to its end, so an ongoing event counts for
 * today. Events come first, then trainings by start time. Cancelled
 * trainings are skipped; events are expected to be active already.
 */
export function pickNextUp(
  events: NextUpEventSource[],
  trainings: NextUpTrainingSource[],
  today: string,
): NextUp | null {
  const upcomingEvents = events
    .map((event) => ({
      event,
      start: timestampToDay(event.startDate),
      end: timestampToDay(event.endDate),
    }))
    .filter(({ end }) => end >= today);
  const upcomingTrainings = trainings
    .filter((training) => training.status === "active")
    .map((training) => ({ training, day: timestampToDay(training.date) }))
    .filter(({ day }) => day >= today);

  const candidates = [
    ...upcomingEvents.map(({ start }) => (start > today ? start : today)),
    ...upcomingTrainings.map(({ day }) => day),
  ];
  if (candidates.length === 0) return null;
  const day = candidates.reduce((min, next) => (next < min ? next : min));

  const eventItems: NextUpItem[] = upcomingEvents
    .filter(({ start, end }) => start <= day && day <= end)
    .sort((a, b) => a.start.localeCompare(b.start) || a.event.name.localeCompare(b.event.name))
    .map(({ event }) => ({
      kind: "event",
      id: event.id,
      title: event.name,
      place: event.address || undefined,
    }));

  const trainingItems: NextUpItem[] = upcomingTrainings
    .filter((entry) => entry.day === day)
    .sort((a, b) => a.training.startTime.localeCompare(b.training.startTime))
    .map(({ training }) => ({
      kind: "training",
      id: training.id,
      title: training.name,
      place: training.location || undefined,
      startTime: training.startTime,
      endTime: training.endTime,
    }));

  return { day, items: [...eventItems, ...trainingItems] };
}
