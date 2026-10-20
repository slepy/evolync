import { useEffect, useState } from "react";
import { StudentRepository } from "@/modules/students/repositories";
import type { StudentOption } from "../types";

/** Active members of a school for the STUDENT field of a new order (12E1), by name. */
export const useSchoolStudents = (schoolId: string | undefined) => {
  const [students, setStudents] = useState<StudentOption[]>([]);

  useEffect(() => {
    if (!schoolId) {
      setStudents([]);
      return;
    }
    const subscription = StudentRepository.observeActiveBySchoolId(schoolId).subscribe({
      next: (members) =>
        setStudents(
          members
            .map((m) => ({
              id: m.id,
              name: m.displayName || m.email || t("unknownMember"),
              email: m.email,
              avatarUrl: m.avatarUrl,
              rankId: m.currentRankId,
            }))
            .sort((a, b) => a.name.localeCompare(b.name)),
        ),
      error: (err: Error) => console.error("[useSchoolStudents] Observer error:", err),
    });
    return () => subscription.unsubscribe();
  }, [schoolId]);

  return students;
};
