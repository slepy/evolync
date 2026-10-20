import { differenceInCalendarDays, format, isSameMonth, isSameYear, type Locale } from "date-fns";
import { dateFnsLocale } from "@/core/i18n/localeTags";

/** `t` or a stand-in (tests). */
export type Translate = (key: string, options?: Record<string, unknown>) => string;

/** Day groups of the inbox (N1): TODAY, YESTERDAY, EARLIER. */
export type InboxGroupKey = "today" | "yesterday" | "earlier";

export interface InboxGroup<T> {
  key: InboxGroupKey;
  items: T[];
  /** Unread items in the group: the "3 new" chip. */
  unread: number;
}

interface InboxItem {
  createdAt: Date;
  readAt?: Date | null;
}

/** date-fns locale of the app language. */
export const inboxDateLocale = (language: string): Locale => dateFnsLocale(language);

export function inboxGroupKey(createdAt: Date, now: Date): InboxGroupKey {
  const days = differenceInCalendarDays(now, createdAt);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return "earlier";
}

/**
 * Newest-first items split into the TODAY / YESTERDAY / EARLIER groups, in
 * that order; empty groups are left out.
 */
export function groupInbox<T extends InboxItem>(items: T[], now: Date): InboxGroup<T>[] {
  const order: InboxGroupKey[] = ["today", "yesterday", "earlier"];
  const groups = new Map<InboxGroupKey, InboxGroup<T>>();

  for (const item of items) {
    const key = inboxGroupKey(item.createdAt, now);
    const group = groups.get(key) ?? { key, items: [], unread: 0 };
    group.items.push(item);
    if (!item.readAt) group.unread += 1;
    groups.set(key, group);
  }

  return order.flatMap((key) => {
    const group = groups.get(key);
    return group ? [group] : [];
  });
}

/**
 * Time on the right of a row: "12 min" / "3 h" today, "18:40" yesterday,
 * "12 Nov" earlier ("12 Nov 2025" in another year).
 */
export function inboxTimeLabel(createdAt: Date, now: Date, translate: Translate, locale: Locale): string {
  const key = inboxGroupKey(createdAt, now);

  if (key === "today") {
    const minutes = Math.max(0, Math.floor((now.getTime() - createdAt.getTime()) / 60_000));
    if (minutes < 60) return translate("notificationsMinutesAgo", { count: Math.max(1, minutes) });
    return translate("notificationsHoursAgo", { count: Math.floor(minutes / 60) });
  }

  if (key === "yesterday") return format(createdAt, "HH:mm", { locale });
  return shortDay(createdAt, now, locale);
}

/** "20 Dec", with the year when it is not the current one. */
export function shortDay(day: Date, now: Date, locale: Locale): string {
  return format(day, isSameYear(day, now) ? "d MMM" : "d MMM yyyy", { locale });
}

/** "1–30 Nov", "28 Oct – 3 Nov", with the year when it is not the current one. */
export function shortDayRange(start: Date, end: Date, now: Date, locale: Locale): string {
  if (isSameMonth(start, end)) {
    if (start.getDate() === end.getDate()) return shortDay(start, now, locale);
    return `${start.getDate()}–${shortDay(end, now, locale)}`;
  }
  const startLabel = format(start, isSameYear(start, end) ? "d MMM" : "d MMM yyyy", { locale });
  return `${startLabel} – ${shortDay(end, now, locale)}`;
}
