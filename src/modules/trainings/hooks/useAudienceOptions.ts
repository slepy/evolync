import { useEffect, useState } from "react";
import { SchoolRepository } from "@/modules/school/repositories";
import { StudentRepository } from "@/modules/students/repositories";
import type { AudienceMember } from "@/core/components/AudienceChoice";

/** Schools and members offered by the audience picker (as the event form does). */
export const useAudienceOptions = (organizationId: string | undefined) => {
  const [schools, setSchools] = useState<Array<{ id: string; name: string }>>([]);
  const [members, setMembers] = useState<AudienceMember[]>([]);

  useEffect(() => {
    if (!organizationId) return;
    const subscription = SchoolRepository.observeByOrganizationId(organizationId).subscribe({
      next: (result) => setSchools(result.map((s) => ({ id: s.id, name: s.name }))),
      error: (err) => console.error("[useAudienceOptions] Schools load error:", err),
    });
    return () => subscription.unsubscribe();
  }, [organizationId]);

  useEffect(() => {
    if (schools.length === 0) {
      setMembers([]);
      return;
    }
    const schoolNames = new Map(schools.map((s) => [s.id, s.name]));
    const subscription = StudentRepository.observeBySchoolIds(schools.map((s) => s.id)).subscribe({
      next: (result) =>
        setMembers(
          result.map((m) => ({
            id: m.id,
            displayName: m.displayName || m.email || t("unknown"),
            schoolName: schoolNames.get(m.schoolId),
          })),
        ),
      error: (err) => console.error("[useAudienceOptions] Members load error:", err),
    });
    return () => subscription.unsubscribe();
  }, [schools]);

  return { schools, members };
};
