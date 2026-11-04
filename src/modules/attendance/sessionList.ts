import type { AttendanceStatus } from "@/database/models/AttendanceRecord";
import { intlLocaleTag } from "@/core/i18n/localeTags";

/** Present / total of one session. */
export interface SessionCounts {
  present: number;
  total: number;
}

/** Sessions of one calendar month (13A: "OCTOBER 2026" above its card). */
export interface SessionMonthGroup<S> {
  /** "2026-10" */
  key: string;
  /** Any day of the month, for the label. */
  month: Date;
  sessions: S[];
}

/** BCP-47 tag of the app language; day-first English, as on the boards. */
export const dateLocaleTag = (language: string): string => intlLocaleTag(language, "en-GB");

const capitalize = (text: string): string => text.charAt(0).toLocaleUpperCase() + text.slice(1);

/** "30 Sep": day-first, three-letter English month (en-GB would write "Sept"). */
const dayMonthShort = (date: Date, locale: string): string =>
  `${date.getDate()} ${date
    .toLocaleDateString(locale === "en-GB" ? "en-US" : locale, { month: "short" })
    .replace(/\.$/, "")}`;

const monthKey = (date: Date): string => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

/** Present and total count per session id from the school's attendance records. */
export function countSessions(
  records: ReadonlyArray<{ trainingSessionId: string; status: AttendanceStatus }>,
): Record<string, SessionCounts> {
  const counts: Record<string, SessionCounts> = {};
  for (const record of records) {
    const c = (counts[record.trainingSessionId] ??= { present: 0, total: 0 });
    c.total += 1;
    if (record.status === "present") c.present += 1;
  }
  return counts;
}

/** Sessions grouped by month, in the order given (newest first from the repository). */
export function groupSessionsByMonth<S extends { sessionDate: Date }>(sessions: readonly S[]): SessionMonthGroup<S>[] {
  const groups: SessionMonthGroup<S>[] = [];
  for (const session of sessions) {
    const key = monthKey(session.sessionDate);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.sessions.push(session);
    else groups.push({ key, month: session.sessionDate, sessions: [session] });
  }
  return groups;
}

/** True when `date` falls on the same local day as `today`. */
export const isSameDay = (date: Date, today: Date): boolean =>
  date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();

/** "October 2026" (the month label, shown uppercase). */
export const formatSessionMonth = (date: Date, locale: string): string =>
  capitalize(date.toLocaleDateString(locale, { month: "long", year: "numeric" }));

/** "Thursday, 2 October" (13A row title). */
export const formatSessionTitle = (date: Date, locale: string): string =>
  `${capitalize(date.toLocaleDateString(locale, { weekday: "long" }))}, ${date.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
  })}`;

/** "Thu, 2 Oct" (13B header). */
export const formatSessionShort = (date: Date, locale: string): string =>
  `${capitalize(date.toLocaleDateString(locale, { weekday: "short" }))}, ${dayMonthShort(date, locale)}`;

/** Counts of each status in an edited list (13B / 13C summary). */
export function countStatuses(items: ReadonlyArray<{ status: AttendanceStatus }>): Record<AttendanceStatus, number> {
  const counts: Record<AttendanceStatus, number> = { present: 0, absent: 0, excused: 0 };
  for (const item of items) counts[item.status] += 1;
  return counts;
}

/**
 * "18:00" (student Attendance row after the school); null for a session saved
 * without a time: local midnight, or UTC midnight (how sync stores a day).
 */
export function formatSessionTime(date: Date, locale: string): string | null {
  if (date.getHours() === 0 && date.getMinutes() === 0) return null;
  if (date.getUTCHours() === 0 && date.getUTCMinutes() === 0) return null;
  return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", hour12: false });
}

/** "Wed, 4 Nov 2026" (13C under the DAY pills, 13C1 DATE field). */
export const formatSessionDate = (date: Date, locale: string): string =>
  `${formatSessionShort(date, locale)} ${date.getFullYear()}`;

const pad2 = (n: number): string => String(n).padStart(2, "0");

/** Local calendar day of `date` as "YYYY-MM-DD" (the DATE field value). */
export const toDayKey = (date: Date): string =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

/** "YYYY-MM-DD" → local midnight of that day; null for anything else. */
export function parseDayKey(day: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return toDayKey(date) === day ? date : null;
}

/** The day before `today`, as "YYYY-MM-DD" (default of Past date). */
export const yesterdayKey = (today: Date): string =>
  toDayKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1));

/**
 * Date a new session is saved with (13C / 13C1): UTC midnight of the picked
 * local day. Sync stores the server `date` as the UTC day of this value and
 * returns UTC midnight on pull, so the day survives a round trip; local
 * midnight or the current time would land on the previous day east of UTC
 * (and collide with that day's session). A future or invalid day falls back
 * to today: sessions are never created ahead.
 */
export function sessionDateForDay(pastDay: string | null, now: Date): Date {
  const picked = pastDay ? parseDayKey(pastDay) : null;
  const day = picked && picked.getTime() <= now.getTime() ? picked : now;
  return new Date(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate()));
}

/** The session already saved on the local day of `date` (one session per day), or null. */
export function findSessionOnDay<S extends { sessionDate: Date }>(sessions: readonly S[], date: Date): S | null {
  return sessions.find((session) => isSameDay(session.sessionDate, date)) ?? null;
}
