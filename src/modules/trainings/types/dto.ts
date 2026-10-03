import type { TrainingVisibility } from "@/database/models/Training";

/** 0 = Sunday … 6 = Saturday (Date#getUTCDay). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Nth weekday of the month: 1st–4th, or -1 for the last one. */
export type WeekOfMonth = 1 | 2 | 3 | 4 | -1;

export type SeriesFrequency = "weekly" | "monthly";

/** One "weekday + weekly/monthly" rule of a recurring series (stored as JSON). */
export interface SeriesRule {
  weekday: Weekday;
  frequency: SeriesFrequency;
  weekOfMonth?: WeekOfMonth;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
}

/** One expanded occurrence of a series. */
export interface SeriesOccurrence {
  day: string; // "YYYY-MM-DD"
  startTime: string;
  endTime: string;
}

interface TrainingCommonInput {
  organizationId: string;
  createdBy: string;
  name: string;
  location?: string;
  visibility: TrainingVisibility;
  schoolId?: string; // required when visibility = 'school'
  inviteeIds?: string[]; // school_member ids, required when visibility = 'whitelist'
}

/** Single mode: N chosen days → N trainings. */
export interface SingleTrainingInput extends TrainingCommonInput {
  dates: string[]; // "YYYY-MM-DD"
  startTime: string;
  endTime: string;
}

/** Recurring mode: rules between two days (≤ 6 months apart). */
export interface SeriesInput extends TrainingCommonInput {
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  rules: SeriesRule[];
}

/** "This training only" edit. */
export interface TrainingPatch {
  name?: string;
  date?: string; // "YYYY-MM-DD"
  startTime?: string;
  endTime?: string;
  location?: string;
  visibility?: TrainingVisibility;
  schoolId?: string;
  inviteeIds?: string[];
}
