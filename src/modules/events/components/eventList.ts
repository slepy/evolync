import { timestampToDay } from "@/modules/trainings/types/helpers";

/**
 * Pure model of the organization calendar's List view: events overlapping a
 * FROM–TO range, optionally narrowed to one type, sorted by start date.
 * Days are "YYYY-MM-DD"; events store them as UTC-midnight timestamps.
 */

export interface EventListSource {
  id: string;
  name: string;
  typeId?: string | null;
  startDate: Date | number;
  endDate: Date | number;
}

/** Type filter value of events without a type ("No type" chip). */
export const NO_EVENT_TYPE = "__none__";

export interface EventListFilter {
  /** "YYYY-MM-DD", inclusive. */
  from: string;
  /** "YYYY-MM-DD", inclusive. */
  to: string;
  /** null = all types; `NO_EVENT_TYPE` = events without a type. */
  typeId: string | null;
}

const overlaps = (event: EventListSource, from: string, to: string) =>
  timestampToDay(event.startDate) <= to && timestampToDay(event.endDate) >= from;

const matchesType = (event: EventListSource, typeId: string | null) =>
  typeId === null || (typeId === NO_EVENT_TYPE ? !event.typeId : event.typeId === typeId);

const byStartThenName = (a: EventListSource, b: EventListSource) =>
  timestampToDay(a.startDate).localeCompare(timestampToDay(b.startDate)) || a.name.localeCompare(b.name);

/** Events with `start ≤ to && end ≥ from` of the chosen type, by start date then name. */
export function filterEventList<T extends EventListSource>(events: readonly T[], filter: EventListFilter): T[] {
  return events
    .filter((event) => overlaps(event, filter.from, filter.to) && matchesType(event, filter.typeId))
    .sort(byStartThenName);
}

/**
 * Type chips above the list: All, every type, then "No type" when an event in
 * the range has none. `labels` are the translated All / No type.
 */
export function eventTypeFilterOptions(
  events: readonly EventListSource[],
  types: ReadonlyArray<{ id: string; name: string }>,
  range: { from: string; to: string },
  labels: { all: string; none: string },
): { value: string; label: string }[] {
  const options = [{ value: "", label: labels.all }, ...types.map((type) => ({ value: type.id, label: type.name }))];
  const untyped = events.some((event) => !event.typeId && overlaps(event, range.from, range.to));
  return untyped ? [...options, { value: NO_EVENT_TYPE, label: labels.none }] : options;
}

/** FROM moved past TO: TO follows it. */
export const withFromDay = (range: { from: string; to: string }, from: string) => ({
  from,
  to: range.to < from ? from : range.to,
});
