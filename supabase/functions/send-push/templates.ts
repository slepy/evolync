/**
 * Server-side push text. The in-app inbox renders its own text with t();
 * push is rendered here because only the device's registered locale is known.
 * Keep wording aligned with the notification* keys in src/core/i18n/locales.
 */

export type PushLocale = "en" | "pl";

type Payload = Record<string, unknown>;
type Render = (p: Payload, locale: PushLocale) => { title: string; body: string };

const str = (value: unknown, fallback: string) =>
  typeof value === "string" && value.trim() ? value : fallback;

const formatAmount = (amount: unknown, currency: unknown, locale: PushLocale) => {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "";
  try {
    return new Intl.NumberFormat(locale === "pl" ? "pl-PL" : "en-US", {
      style: "currency",
      currency: str(currency, "PLN"),
    }).format(value);
  } catch {
    return `${value} ${str(currency, "")}`.trim();
  }
};

/** `YYYY-MM-DD` → "1 Oct 2026" / "1 paź 2026" (UTC, so the day never shifts). */
const formatDay = (value: unknown, locale: PushLocale) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(value)) return "";
  return new Intl.DateTimeFormat(locale === "pl" ? "pl-PL" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`));
};

const TEMPLATES: Record<string, Record<PushLocale, Render>> = {
  order_created: {
    en: (p) => ({ title: "New order", body: `New order from ${str(p.studentName, "a student")}` }),
    pl: (p) => ({ title: "Nowe zamówienie", body: `Nowe zamówienie od ${str(p.studentName, "ucznia")}` }),
  },
  join_request_created: {
    en: (p) => ({
      title: "New join request",
      body: `${str(p.displayName, "Someone")} wants to join ${str(p.schoolName, "your school")}`,
    }),
    pl: (p) => ({
      title: "Nowa prośba o dołączenie",
      body: `${str(p.displayName, "Ktoś")} chce dołączyć do ${str(p.schoolName, "Twojej szkoły")}`,
    }),
  },
  event_rsvp_attending: {
    en: (p) => ({
      title: "New attendee",
      body: `${str(p.studentName, "A student")} is attending ${str(p.eventName, "your event")}`,
    }),
    pl: (p) => ({
      title: "Nowy uczestnik",
      body: `${str(p.studentName, "Uczeń")} weźmie udział w: ${str(p.eventName, "wydarzenie")}`,
    }),
  },
  payment_created: {
    en: (p, l) => {
      const start = formatDay(p.periodStart, l);
      const end = formatDay(p.periodEnd, l);
      const period = start && end ? ` for ${start} – ${end}` : "";
      return { title: "New payment", body: `New payment: ${formatAmount(p.amount, p.currency, l)}${period}` };
    },
    pl: (p, l) => {
      const start = formatDay(p.periodStart, l);
      const end = formatDay(p.periodEnd, l);
      const period = start && end ? ` za ${start} – ${end}` : "";
      return { title: "Nowa płatność", body: `Nowa płatność: ${formatAmount(p.amount, p.currency, l)}${period}` };
    },
  },
  event_assigned: {
    en: (p, l) => {
      const date = formatDay(p.startDate, l);
      return {
        title: "Added to an event",
        body: `You've been added to ${str(p.eventName, "an event")}${date ? ` on ${date}` : ""}`,
      };
    },
    pl: (p, l) => {
      const date = formatDay(p.startDate, l);
      return {
        title: "Dodano Cię do wydarzenia",
        body: `Dodano Cię do: ${str(p.eventName, "wydarzenie")}${date ? ` (${date})` : ""}`,
      };
    },
  },
};

const GENERIC: Record<PushLocale, { title: string; body: string }> = {
  en: { title: "Evolync", body: "You have a new notification." },
  pl: { title: "Evolync", body: "Masz nowe powiadomienie." },
};

export const normalizeLocale = (locale: unknown): PushLocale =>
  typeof locale === "string" && locale.toLowerCase().startsWith("pl") ? "pl" : "en";

export function renderPush(type: string, payload: Payload, locale: PushLocale) {
  const render = TEMPLATES[type]?.[locale];
  return render ? render(payload ?? {}, locale) : GENERIC[locale];
}

/** One push standing in for a burst of notifications. */
export function renderBurstSummary(count: number, locale: PushLocale) {
  return locale === "pl"
    ? { title: "Evolync", body: `Masz ${count}+ nowych powiadomień` }
    : { title: "Evolync", body: `You have ${count}+ new notifications` };
}
