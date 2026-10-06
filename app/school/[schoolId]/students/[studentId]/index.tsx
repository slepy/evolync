import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";
import { StudentDetailsScreen } from "@/modules/students/components";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";

/** Student details (16E–16G). */
export default function StudentDetailsRoute() {
  useRequireOrganizationOwner();
  const { schoolId, studentId } = useLocalSearchParams<{ schoolId: string; studentId: string }>();
  const router = useRouter();

  if (!schoolId || !studentId) return null;

  return (
    <StudentDetailsScreen
      schoolId={schoolId}
      studentId={studentId}
      onOpenOrder={(orderId) => router.push(`/school/${schoolId}/orders/${orderId}`)}
      onEdit={() => router.push(`/school/${schoolId}/students/${studentId}/edit`)}
      onArchived={() => router.back()}
    />
  );
}
