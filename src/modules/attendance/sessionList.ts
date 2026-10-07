import type { AttendanceStatus } from "@/database/models/AttendanceRecord";

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
export const dateLocaleTag = (language: string): string => (language === "pl" ? "pl-PL" : "en-GB");

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

/** "4 Oct" (13C header after "Today, "). */
export const formatDayMonthShort = dayMonthShort;

/** Counts of each status in an edited list (13B / 13C summary). */
export function countStatuses(items: ReadonlyArray<{ status: AttendanceStatus }>): Record<AttendanceStatus, number> {
  const counts: Record<AttendanceStatus, number> = { present: 0, absent: 0, excused: 0 };
  for (const item of items) counts[item.status] += 1;
  return counts;
}

/** "18:00" (student Attendance row after the school); null for a session saved without a time (midnight). */
export function formatSessionTime(date: Date, locale: string): string | null {
  if (date.getHours() === 0 && date.getMinutes() === 0) return null;
  return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", hour12: false });
}
