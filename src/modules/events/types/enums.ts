export const EVENT_FILTER = {
  UPCOMING: "upcoming",
  HISTORICAL: "historical",
} as const;

export type EventFilter = (typeof EVENT_FILTER)[keyof typeof EVENT_FILTER];
