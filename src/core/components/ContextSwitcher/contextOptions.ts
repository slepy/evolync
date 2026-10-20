import type { ContextOption } from "./types";

export const orgOptionId = (organizationId: string) => `org:${organizationId}`;

export interface ContextOptionsInput {
  /** The user's own organization (owner), if any. */
  organization: { id: string; name: string } | null;
  /** Schools the user trains in, by member id. */
  memberships: { memberId: string; schoolId: string }[];
  /** Local schools: names, addresses and the organization's school count. */
  schools: { id: string; name: string; address?: string; organizationId: string }[];
}

/**
 * Rows of the context sheet (board 3): the own organization first
 * ("Organization · 3 schools"), then one row per school the user trains in
 * ("Student · Poznań"; "Student" without an address, "…" until the school
 * is fetched).
 */
export function buildContextOptions({ organization, memberships, schools }: ContextOptionsInput): ContextOption[] {
  const own: ContextOption[] = organization
    ? [
        {
          id: orgOptionId(organization.id),
          context: "organization",
          title: organization.name,
          subtitle: t("contextOrganizationSchools", {
            count: schools.filter((s) => s.organizationId === organization.id).length,
          }),
        },
      ]
    : [];

  const training = memberships.map((m): ContextOption => {
    const school = schools.find((s) => s.id === m.schoolId);
    return {
      id: m.memberId,
      context: "student",
      title: school?.name ?? "…",
      subtitle: school?.address ? t("contextStudentAt", { place: school.address }) : t("student"),
    };
  });

  return [...own, ...training];
}
