import { TRAINING_VISIBILITY, type TrainingVisibility } from "@/database/models/Training";
import type { SeriesRule, WeekOfMonth } from "../types/dto";
import { TRAINING_MODE, type TrainingMode } from "../types/enums";
import {
  addMonths,
  expandSeriesRules,
  isTimeRangeValid,
  isValidDay,
  localToday,
  maxSeriesEnd,
  parseJsonArray,
  timestampToDay,
} from "../types/helpers";
import { buildTrainingSchema, type TrainingFormValues } from "../validation";

/**
 * Pure state of the training form (11A single, 11B recurring, 11C edit):
 * defaults, validation into `TrainingFormValues`, change detection and the
 * texts summarizing rules.
 */

/** Flat form state: both modes' fields live side by side so switching keeps them. */
export interface TrainingFormState {
  mode: TrainingMode;
  name: string;
  location: string;
  visibility: TrainingVisibility;
  schoolId?: string;
  inviteeIds: string[];
  // single (one day)
  date: string;
  startTime: string;
  endTime: string;
  // recurring
  startDate: string;
  endDate: string;
  rules: SeriesRule[];
}

/** Field path → translation key ("name", "rules.1.endTime"…). */
export type TrainingFormErrors = Record<string, string>;

export const DEFAULT_START_TIME = "18:00";
export const DEFAULT_END_TIME = "19:30";

export const newRule = (weekday: SeriesRule["weekday"] = 1): SeriesRule => ({
  weekday,
  frequency: "weekly",
  startTime: DEFAULT_START_TIME,
  endTime: DEFAULT_END_TIME,
});

/** `day` as a weekday 0–6 (Sunday first), for the first rule of a new series. */
const weekdayOf = (day: string): SeriesRule["weekday"] =>
  new Date(`${day}T00:00:00Z`).getUTCDay() as SeriesRule["weekday"];

/**
 * A new training starting on `day` (the calendar's selected day; past days
 * and bad input fall back to today), optionally for one school.
 */
export const initialTrainingForm = (day?: string, schoolId?: string, today: string = localToday()): TrainingFormState => {
  const start = day && isValidDay(day) && day >= today ? day : today;
  return {
    mode: TRAINING_MODE.SINGLE,
    name: "",
    location: "",
    visibility: schoolId ? TRAINING_VISIBILITY.SCHOOL : TRAINING_VISIBILITY.ORGANIZATION,
    schoolId,
    inviteeIds: [],
    date: start,
    startTime: DEFAULT_START_TIME,
    endTime: DEFAULT_END_TIME,
    startDate: start,
    endDate: addMonths(start, 3),
    rules: [newRule(weekdayOf(start))],
  };
};

/** What the schema validates for the current mode. */
export const toSchemaInput = (form: TrainingFormState) => {
  const audience = {
    name: form.name,
    location: form.location,
    visibility: form.visibility,
    schoolId: form.visibility === TRAINING_VISIBILITY.SCHOOL ? form.schoolId : undefined,
    inviteeIds: form.visibility === TRAINING_VISIBILITY.WHITELIST ? form.inviteeIds : [],
  };
  return form.mode === TRAINING_MODE.SINGLE
    ? { mode: form.mode, ...audience, dates: [form.date], startTime: form.startTime, endTime: form.endTime }
    : { mode: form.mode, ...audience, startDate: form.startDate, endDate: form.endDate, rules: form.rules };
};

/** Maps a schema path to the field showing the error (single `dates.0` → `date`). */
const errorPath = (path: (string | number)[]): string => {
  if (path[0] === "dates") return "date";
  return path.join(".");
};

export type TrainingFormResult =
  | { ok: true; values: TrainingFormValues }
  | { ok: false; errors: TrainingFormErrors };

export const validateTrainingForm = (
  form: TrainingFormState,
  getToday: () => string = () => localToday(),
): TrainingFormResult => {
  const result = buildTrainingSchema(getToday).safeParse(toSchemaInput(form));
  if (result.success) return { ok: true, values: result.data };
  const errors: TrainingFormErrors = {};
  for (const issue of result.error.issues) {
    const key = errorPath(issue.path);
    if (!errors[key]) errors[key] = issue.message;
  }
  return { ok: false, errors };
};

/** Has anything the user can see changed since `initial` (Save waits for a change)? */
export const hasTrainingChanges = (form: TrainingFormState, initial: TrainingFormState): boolean =>
  JSON.stringify(toSchemaInput(form)) !== JSON.stringify(toSchemaInput(initial));

/** Trainings the recurring draft would create, or null while it is invalid. */
export const countOccurrences = (form: TrainingFormState): number | null => {
  const { startDate, endDate, rules } = form;
  if (!isValidDay(startDate) || !isValidDay(endDate) || endDate < startDate) return null;
  if (endDate > maxSeriesEnd(startDate)) return null;
  if (rules.length === 0 || rules.some((r) => !isTimeRangeValid(r.startTime, r.endTime))) return null;
  if (rules.some((r) => r.frequency === "monthly" && r.weekOfMonth === undefined)) return null;
  return expandSeriesRules(rules, startDate, endDate).length;
};

/** Switching a rule to monthly picks the 1st week; back to weekly drops it. */
export const setRuleFrequency = (rule: SeriesRule, frequency: SeriesRule["frequency"]): SeriesRule =>
  frequency === "monthly"
    ? { ...rule, frequency, weekOfMonth: rule.weekOfMonth ?? 1 }
    : { weekday: rule.weekday, frequency, startTime: rule.startTime, endTime: rule.endTime };

/** A new rule copies the last rule's times on the next weekday. */
export const nextRule = (rules: SeriesRule[]): SeriesRule => {
  const last = rules[rules.length - 1];
  if (!last) return newRule();
  return {
    ...newRule(((last.weekday + 1) % 7) as SeriesRule["weekday"]),
    startTime: last.startTime,
    endTime: last.endTime,
  };
};

// ============================================================================
// Texts
// ============================================================================

export const weekOfMonthKey = (week: WeekOfMonth): string =>
  week === -1 ? "trainingsWeekOfMonthLast" : `trainingsWeekOfMonth${week}`;

/** Under a monthly rule (11B): "Every 1st Saturday of the month". */
export const monthlyRuleSummary = (rule: SeriesRule): string | null =>
  rule.frequency === "monthly" && rule.weekOfMonth !== undefined
    ? t("trainingsMonthlyRuleSummary", {
        week: t(`trainingsWeekOfMonthOrdinal${rule.weekOfMonth === -1 ? "Last" : rule.weekOfMonth}`),
        weekday: t(`trainingsWeekdayLong${rule.weekday}`),
      })
    : null;

const MONDAY_FIRST = [1, 2, 3, 4, 5, 6, 0];
const byWeekday = (a: SeriesRule, b: SeriesRule) => MONDAY_FIRST.indexOf(a.weekday) - MONDAY_FIRST.indexOf(b.weekday);

/** Series card on the details (11D): "Weekly Mon, Wed · Monthly 1st Sat". */
export const seriesRulesSummary = (rules: SeriesRule[]): string => {
  const weekly = [...new Set(rules.filter((r) => r.frequency === "weekly").sort(byWeekday).map((r) => r.weekday))];
  const monthly = rules
    .filter((r) => r.frequency === "monthly" && r.weekOfMonth !== undefined)
    .sort(byWeekday)
    .map((r) => `${t(weekOfMonthKey(r.weekOfMonth as WeekOfMonth))} ${t(`trainingsWeekdayShort${r.weekday}`)}`);
  const parts: string[] = [];
  if (weekly.length) parts.push(`${t("trainingsWeekly")} ${weekly.map((d) => t(`trainingsWeekdayShort${d}`)).join(", ")}`);
  if (monthly.length) parts.push(`${t("trainingsMonthly")} ${[...new Set(monthly)].join(", ")}`);
  return parts.join(" · ");
};

// ============================================================================
// Edit
// ============================================================================

interface TrainingFields {
  name: string;
  location?: string | null;
  visibility: TrainingVisibility;
  schoolId?: string | null;
  date: Date;
  startTime: string;
  endTime: string;
}

interface SeriesFields {
  name: string;
  location?: string | null;
  visibility: TrainingVisibility;
  schoolId?: string | null;
  inviteeIds: string;
  endDate: Date;
  rules: string;
}

/** "This training only" (single mode, one day). */
export const trainingToForm = (training: TrainingFields, inviteeIds: string[]): TrainingFormState => {
  const day = timestampToDay(training.date);
  return {
    ...initialTrainingForm(day, undefined, day),
    mode: TRAINING_MODE.SINGLE,
    name: training.name,
    location: training.location ?? "",
    visibility: training.visibility,
    schoolId: training.schoolId ?? undefined,
    inviteeIds,
    date: day,
    startTime: training.startTime,
    endTime: training.endTime,
  };
};

/** "This and following" (11C): the series' values, starting on the selected day. */
export const seriesToForm = (series: SeriesFields, fromDay: string): TrainingFormState => {
  const seriesEnd = timestampToDay(series.endDate);
  return {
    ...initialTrainingForm(fromDay, undefined, fromDay),
    mode: TRAINING_MODE.RECURRING,
    name: series.name,
    location: series.location ?? "",
    visibility: series.visibility,
    schoolId: series.schoolId ?? undefined,
    inviteeIds: parseJsonArray(series.inviteeIds),
    startDate: fromDay,
    endDate: seriesEnd < fromDay ? fromDay : seriesEnd,
    rules: parseJsonArray<SeriesRule>(series.rules),
  };
};
