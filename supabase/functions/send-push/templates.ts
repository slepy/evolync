/**
 * Server-side push text. The in-app inbox renders its own text with t();
 * push is rendered here because only the device's registered locale is known.
 * Keep wording aligned with the notification* keys in src/core/i18n/locales.
 */

export type PushLocale = "en" | "pl" | "hu";

const INTL: Record<PushLocale, { number: string; date: string }> = {
  en: { number: "en-US", date: "en-GB" },
  pl: { number: "pl-PL", date: "pl-PL" },
  hu: { number: "hu-HU", date: "hu-HU" },
};

type Payload = Record<string, unknown>;
type Render = (p: Payload, locale: PushLocale) => { title: string; body: string };

const str = (value: unknown, fallback: string) =>
  typeof value === "string" && value.trim() ? value : fallback;

const formatAmount = (amount: unknown, currency: unknown, locale: PushLocale) => {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "";
  try {
    return new Intl.NumberFormat(INTL[locale].number, {
      style: "currency",
      currency: str(currency, "PLN"),
    }).format(value);
  } catch {
    return `${value} ${str(currency, "")}`.trim();
  }
};

/** `YYYY-MM-DD` → "1 Oct 2026" / "1 paź 2026" / "2026. okt. 1." (UTC, so the day never shifts). */
const formatDay = (value: unknown, locale: PushLocale) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(value)) return "";
  return new Intl.DateTimeFormat(INTL[locale].date, {
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
    hu: (p) => ({ title: "Új rendelés", body: `Új rendelés: ${str(p.studentName, "egy tanuló")}` }),
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
    hu: (p) => ({
      title: "Új csatlakozási kérés",
      body: `${str(p.displayName, "Valaki")} csatlakozna ide: ${str(p.schoolName, "az iskolád")}`,
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
    hu: (p) => ({
      title: "Új résztvevő",
      body: `${str(p.studentName, "Egy tanuló")} részt vesz: ${str(p.eventName, "az eseményed")}`,
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
    hu: (p, l) => {
      const start = formatDay(p.periodStart, l);
      const end = formatDay(p.periodEnd, l);
      const period = start && end ? `, időszak: ${start} – ${end}` : "";
      return { title: "Új befizetés", body: `Új befizetés: ${formatAmount(p.amount, p.currency, l)}${period}` };
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
    hu: (p, l) => {
      const date = formatDay(p.startDate, l);
      return {
        title: "Hozzáadtak egy eseményhez",
        body: `Hozzáadtak ehhez: ${str(p.eventName, "egy esemény")}${date ? ` (${date})` : ""}`,
      };
    },
  },
  join_request_approved: {
    en: (p) => ({
      title: "Request approved",
      body: `You're now a member of ${str(p.schoolName, "your school")}`,
    }),
    pl: (p) => ({
      title: "Prośba zaakceptowana",
      body: `Należysz teraz do: ${str(p.schoolName, "Twojej szkoły")}`,
    }),
    hu: (p) => ({
      title: "Kérés elfogadva",
      body: `Mostantól tag vagy itt: ${str(p.schoolName, "az iskolád")}`,
    }),
  },
};

const GENERIC: Record<PushLocale, { title: string; body: string }> = {
  en: { title: "Evolync", body: "You have a new notification." },
  pl: { title: "Evolync", body: "Masz nowe powiadomienie." },
  hu: { title: "Evolync", body: "Új értesítésed érkezett." },
};

export const normalizeLocale = (locale: unknown): PushLocale => {
  const code = typeof locale === "string" ? locale.toLowerCase() : "";
  if (code.startsWith("pl")) return "pl";
  if (code.startsWith("hu")) return "hu";
  return "en";
};

export function renderPush(type: string, payload: Payload, locale: PushLocale) {
  const render = TEMPLATES[type]?.[locale];
  return render ? render(payload ?? {}, locale) : GENERIC[locale];
}

/** One push standing in for a burst of notifications. */
export function renderBurstSummary(count: number, locale: PushLocale) {
  if (locale === "pl") return { title: "Evolync", body: `Masz ${count}+ nowych powiadomień` };
  if (locale === "hu") return { title: "Evolync", body: `${count}+ új értesítésed van` };
  return { title: "Evolync", body: `You have ${count}+ new notifications` };
}
