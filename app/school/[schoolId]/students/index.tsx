import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";
import { StudentsScreen } from "@/modules/students/components";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";

/** Students (16A) / Join requests (16B); `?tab=requests` opens the requests (e.g. from a notification). */
export default function StudentsRoute() {
  useRequireOrganizationOwner();
  const { schoolId, tab } = useLocalSearchParams<{ schoolId: string; tab?: string }>();
  const router = useRouter();

  if (!schoolId) return null;

  return (
    <StudentsScreen
      schoolId={schoolId}
      initialTab={tab === "requests" ? "requests" : "students"}
      onStudentPress={(studentId) => router.push(`/school/${schoolId}/students/${studentId}`)}
      onAddStudent={() => router.push(`/school/${schoolId}/students/create`)}
      onNewInvite={() => router.push(`/school/${schoolId}/students/generate-invite`)}
    />
  );
}
