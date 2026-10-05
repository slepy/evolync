import { EVENT_VISIBILITY, type EventVisibility } from "@/database/models/Event";
import { dayToTimestamp, isValidDay, localToday, timestampToDay } from "@/modules/trainings/types/helpers";
import { EVENT_DEFAULT_CURRENCY } from "../types/enums";
import { createEventSchema, type CreateEventFormValues } from "../validation";

/**
 * Pure state of the event form (10A new, 10B edit): defaults, validation
 * into `CreateEventFormValues`, change detection and the day count.
 */

export interface EventFormState {
  name: string;
  shortNote: string;
  address: string;
  /** "YYYY-MM-DD" */
  startDate: string;
  /** "YYYY-MM-DD" */
  endDate: string;
  /** As typed ("250", "12,50"); empty means free. */
  price: string;
  currency: string;
  visibility: EventVisibility;
  schoolId?: string;
  inviteeIds: string[];
}

/** Field path → translation key ("name", "endDate", "inviteeIds"…). */
export type EventFormErrors = Record<string, string>;

export type EventFormResult =
  | { ok: true; values: CreateEventFormValues }
  | { ok: false; errors: EventFormErrors };

/** What the form needs from a stored event. */
export interface EventLike {
  name: string;
  shortNote?: string | null;
  address?: string | null;
  startDate: Date | number;
  endDate: Date | number;
  price: number;
  currency: string;
  visibility: EventVisibility;
  schoolId?: string | null;
}

/**
 * A new event starting and ending on `day` (the calendar's selected day;
 * past days and bad input fall back to today).
 */
export const initialEventForm = (day?: string, today: string = localToday()): EventFormState => {
  const start = day && isValidDay(day) && day >= today ? day : today;
  return {
    name: "",
    shortNote: "",
    address: "",
    startDate: start,
    endDate: start,
    price: "",
    currency: EVENT_DEFAULT_CURRENCY,
    visibility: EVENT_VISIBILITY.ORGANIZATION,
    inviteeIds: [],
  };
};

/** The edit form of a stored event; `inviteeIds` are its current participants. */
export const eventToForm = (event: EventLike, inviteeIds: string[] = []): EventFormState => ({
  name: event.name,
  shortNote: event.shortNote ?? "",
  address: event.address ?? "",
  startDate: timestampToDay(event.startDate),
  endDate: timestampToDay(event.endDate),
  price: String(event.price),
  currency: event.currency,
  visibility: event.visibility,
  schoolId: event.visibility === EVENT_VISIBILITY.SCHOOL ? event.schoolId ?? undefined : undefined,
  inviteeIds: event.visibility === EVENT_VISIBILITY.WHITELIST ? inviteeIds : [],
});

const optional = (value: string): string | undefined => value.trim() || undefined;

/** What the schema validates: only the audience fields of the chosen visibility. */
export const toSchemaInput = (form: EventFormState) => ({
  name: form.name.trim(),
  shortNote: optional(form.shortNote),
  address: optional(form.address),
  startDate: form.startDate,
  endDate: form.endDate,
  price: form.price.trim() || "0",
  currency: form.currency,
  visibility: form.visibility,
  schoolId: form.visibility === EVENT_VISIBILITY.SCHOOL ? form.schoolId : undefined,
  whitelistedMemberIds:
    form.visibility === EVENT_VISIBILITY.WHITELIST ? [...form.inviteeIds].sort() : undefined,
});

/** Maps a schema path to the field showing the error. */
const errorPath = (path: (string | number)[]): string =>
  path[0] === "whitelistedMemberIds" ? "inviteeIds" : String(path[0] ?? "form");

export const validateEventForm = (form: EventFormState): EventFormResult => {
  const result = createEventSchema.safeParse(toSchemaInput(form));
  if (result.success) return { ok: true, values: result.data };
  const errors: EventFormErrors = {};
  for (const issue of result.error.issues) {
    const key = errorPath(issue.path);
    if (!errors[key]) errors[key] = issue.message;
  }
  return { ok: false, errors };
};

/** Has anything the user can see changed since `initial` (Save waits for a change)? */
export const hasEventChanges = (form: EventFormState, initial: EventFormState): boolean =>
  JSON.stringify(toSchemaInput(form)) !== JSON.stringify(toSchemaInput(initial));

/** Days the event spans, both ends included ("20–24 Nov" → 5); null for bad input. */
export const eventDayCount = (startDate: string, endDate: string): number | null => {
  if (!isValidDay(startDate) || !isValidDay(endDate) || endDate < startDate) return null;
  return Math.round((dayToTimestamp(endDate) - dayToTimestamp(startDate)) / 86_400_000) + 1;
};

/** Start moved past the end: the end follows it, keeping the event at least one day. */
export const withStartDate = (form: EventFormState, startDate: string): EventFormState => ({
  ...form,
  startDate,
  endDate: form.endDate < startDate ? startDate : form.endDate,
});
