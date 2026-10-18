import { formatPhoneNumber } from "@/core/utils/phoneHelpers";
import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";
import { StudentFormScreen } from "@/modules/students/components";
import { createStudent } from "@/modules/students/services";
import type { StudentFormValues } from "@/modules/students/validation";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";

/** New student without an app account (16C); shows on the list right away, even offline. */
export default function CreateStudentRoute() {
  useRequireOrganizationOwner();
  const { schoolId } = useLocalSearchParams<{ schoolId: string }>();
  const router = useRouter();

  if (!schoolId) return null;

  const handleSubmit = async (data: StudentFormValues) => {
    await createStudent(schoolId, {
      displayName: data.displayName,
      email: data.email || undefined,
      phoneNumber: formatPhoneNumber(data.phoneNumber) ?? undefined,
    });
    router.back();
  };

  return <StudentFormScreen onSubmit={handleSubmit} />;
}
