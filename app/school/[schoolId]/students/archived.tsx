import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";
import { ArchivedStudentsScreen } from "@/modules/students/components";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";

/** Archived students (16H), opened from the 16A header. */
export default function ArchivedStudentsRoute() {
  useRequireOrganizationOwner();
  const { schoolId } = useLocalSearchParams<{ schoolId: string }>();
  const router = useRouter();

  if (!schoolId) return null;

  return (
    <ArchivedStudentsScreen
      schoolId={schoolId}
      onStudentPress={(studentId) => router.push(`/school/${schoolId}/students/${studentId}`)}
    />
  );
}
