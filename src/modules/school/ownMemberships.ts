import type { SchoolMembership } from "@/store";

export interface LocalMemberRow {
  id: string;
  schoolId: string;
}

export interface LocalSchoolRow {
  id: string;
  organizationId: string;
}

/**
 * The store's memberships plus the user's active member rows from the local
 * database whose school is synced (an approved join request arrives with the
 * next sync). Null when nothing is new. Add-only: a membership that went away
 * is dropped by the server refresh at sign-in / app start, never by a local
 * database that may still be filling up.
 */
export function mergeLocalMemberships(
  current: SchoolMembership[],
  members: LocalMemberRow[],
  schools: LocalSchoolRow[],
): SchoolMembership[] | null {
  const known = new Set(current.map((m) => m.memberId));
  const organizationBySchool = new Map(schools.map((s) => [s.id, s.organizationId]));

  const added: SchoolMembership[] = [];
  for (const member of members) {
    const organizationId = organizationBySchool.get(member.schoolId);
    if (known.has(member.id) || !organizationId) continue;
    known.add(member.id);
    added.push({ memberId: member.id, schoolId: member.schoolId, organizationId });
  }

  return added.length > 0 ? [...current, ...added] : null;
}
