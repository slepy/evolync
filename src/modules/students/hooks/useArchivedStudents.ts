import type SchoolMember from "@/database/models/SchoolMember";
import { useEffect, useState } from "react";
import { StudentRepository } from "../repositories";

/** Archived students of a school (16H), live from WatermelonDB. */
export const useArchivedStudents = (schoolId: string) => {
  const [students, setStudents] = useState<SchoolMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const subscription = StudentRepository.observeArchivedBySchoolId(schoolId).subscribe({
      next: (result: SchoolMember[]) => {
        setStudents(result);
        setIsLoading(false);
      },
      error: (err: Error) => {
        console.error("[useArchivedStudents] Students error:", err);
        setIsLoading(false);
      },
    });
    return () => subscription.unsubscribe();
  }, [schoolId]);

  return { students, isLoading };
};
