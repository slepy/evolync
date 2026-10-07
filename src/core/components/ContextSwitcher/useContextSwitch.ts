import type School from "@/database/models/School";
import { SchoolRepository } from "@/modules/school/repositories";
import { useStore } from "@/store";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ContextOption } from "./ContextSheet";

export const orgOptionId = (organizationId: string) => `org:${organizationId}`;

/**
 * Everything the context switcher (board 3) needs, from the store and the
 * local schools table: the user's own organization (Manage), every school
 * they train in (Train as student), what a tap does and "Join another school".
 * Schools of foreign organizations missing locally are fetched once.
 */
export function useContextSwitch() {
  const router = useRouter();
  const organization = useStore((s) => s.organization);
  const memberships = useStore((s) => s.schoolMemberships);
  const setActiveMembershipId = useStore((s) => s.setActiveMembershipId);
  const [schools, setSchools] = useState<School[]>([]);

  useEffect(() => {
    const subscription = SchoolRepository.observeAll().subscribe(setSchools);
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    for (const m of memberships) {
      if (!schools.some((s) => s.id === m.schoolId)) {
        SchoolRepository.findByIdOrFetchFromSupabase(m.schoolId).catch(console.error);
      }
    }
  }, [memberships, schools]);

  const options = useMemo<ContextOption[]>(() => {
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
        subtitle: school?.address ? t("contextStudentAt", { place: school.address }) : t("contextStudent"),
      };
    });
    return [...own, ...training];
  }, [organization, memberships, schools]);

  const select = useCallback(
    async (option: ContextOption) => {
      if (option.context === "organization") {
        router.replace("/organization/dashboard" as any);
        return;
      }
      setActiveMembershipId(option.id);
      router.replace("/user/dashboard" as any);
      const AsyncStorage = require("@react-native-async-storage/async-storage").default;
      await AsyncStorage.setItem("activeMembershipId", option.id);
    },
    [router, setActiveMembershipId],
  );

  const joinSchool = useCallback(() => router.push("/school/join" as any), [router]);

  return { options, schools, select, joinSchool };
}
