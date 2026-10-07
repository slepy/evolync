import { matchesSearch } from "@/core/components/SearchField/matchesSearch";
import { MemberStatus, getDisplayStatus } from "./types";

export interface StudentListItem {
  displayName?: string | null;
  email?: string | null;
  status: MemberStatus;
  userId?: string | null;
}

/** Order on the 16A list: members with an account, then pending, then the ones without; by name inside. */
const STATUS_ORDER: Record<MemberStatus, number> = {
  active: 0,
  pending: 1,
  offline: 2,
  rejected: 3,
  archived: 4,
};

/** Students matching the search, in list order. */
export const visibleStudents = <T extends StudentListItem>(students: T[], query: string): T[] =>
  students
    .filter((s) => matchesSearch(query, s.displayName, s.email))
    .sort(
      (a, b) =>
        STATUS_ORDER[getDisplayStatus(a.status, a.userId)] - STATUS_ORDER[getDisplayStatus(b.status, b.userId)] ||
        (a.displayName ?? "").localeCompare(b.displayName ?? ""),
    );

/**
 * Status pill on the right of a 16A row: none for an active member; "No
 * account" (neutral) for a student added by the instructor; the others by name.
 */
export const studentStatusPill = (
  status: MemberStatus,
  userId?: string | null,
): { label: string; tone: "neutral" | "warning" | "muted" } | null => {
  const display = getDisplayStatus(status, userId);
  switch (display) {
    case MemberStatus.ACTIVE:
      return null;
    case MemberStatus.OFFLINE:
      return { label: "statusNoAccount", tone: "neutral" };
    case MemberStatus.PENDING:
      return { label: "statusPending", tone: "warning" };
    case MemberStatus.REJECTED:
      return { label: "statusRejected", tone: "muted" };
    default:
      return { label: "statusArchived", tone: "muted" };
  }
};

export type RequestAge =
  | { kind: "justNow" }
  | { kind: "minutes"; count: number }
  | { kind: "hours"; count: number }
  | { kind: "yesterday" }
  | { kind: "date" };

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** How long ago a join request was sent (16B: "2 h ago", "Yesterday", "3 Oct"). */
export const requestAge = (sentAt: Date, now: Date): RequestAge => {
  const minutes = Math.floor((now.getTime() - sentAt.getTime()) / 60_000);
  if (minutes < 1) return { kind: "justNow" };
  if (minutes < 60) return { kind: "minutes", count: minutes };
  if (startOfDay(sentAt) === startOfDay(now)) return { kind: "hours", count: Math.floor(minutes / 60) };
  if (startOfDay(now) - startOfDay(sentAt) <= 86_400_000 + 3_600_000) return { kind: "yesterday" };
  return { kind: "date" };
};

/** Validity options of a new invite code (16D). */
export const INVITE_VALIDITY_DAYS = [1, 7, 30] as const;
export type InviteValidityDays = (typeof INVITE_VALIDITY_DAYS)[number];

/** Expiry of a code created now, valid for `days`. */
export const inviteExpiry = (now: Date, days: number): Date => new Date(now.getTime() + days * 86_400_000);

/** The invite shown on the 16A card: the one that stays valid the longest. */
export const latestInvite = <T extends { expiresAt: number | Date }>(invites: T[]): T | undefined =>
  invites.reduce<T | undefined>(
    (best, invite) => (!best || +new Date(invite.expiresAt) > +new Date(best.expiresAt) ? invite : best),
    undefined,
  );
