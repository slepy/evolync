export const EVENT_FILTER = {
  UPCOMING: "upcoming",
  HISTORICAL: "historical",
} as const;

export type EventFilter = (typeof EVENT_FILTER)[keyof typeof EVENT_FILTER];

/** Currencies offered by the event CURRENCY field (same set as products). */
export const EVENT_CURRENCIES = ["PLN", "EUR", "USD", "GBP"] as const;
export const EVENT_DEFAULT_CURRENCY = "PLN";
