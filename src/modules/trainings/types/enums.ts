export const TRAINING_MODE = {
  SINGLE: "single",
  RECURRING: "recurring",
} as const;

export type TrainingMode = (typeof TRAINING_MODE)[keyof typeof TRAINING_MODE];

/** Scope of an edit/delete on a series occurrence. */
export const TRAINING_EDIT_SCOPE = {
  THIS: "this",
  FOLLOWING: "following",
} as const;

export type TrainingEditScope =
  (typeof TRAINING_EDIT_SCOPE)[keyof typeof TRAINING_EDIT_SCOPE];

/** Longest allowed series, in months (Until ≤ From + 6 months). */
export const MAX_SERIES_MONTHS = 6;

/** Days counted by the dashboard "Trainings" badge. */
export const DASHBOARD_BADGE_DAYS = 7;

export const TRAINING_NAME_MAX = 60;
export const TRAINING_LOCATION_MAX = 300;
