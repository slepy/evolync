import type SchoolMember from "@/database/models/SchoolMember";
import { LoadingScreen } from "@/core/components";
import { formatPhoneNumber, parsePhoneNumber } from "@/core/utils/phoneHelpers";
import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";
import { StudentFormScreen } from "@/modules/students/components";
import { StudentRepository } from "@/modules/students/repositories";
import { updateStudent } from "@/modules/students/services";
import type { StudentFormValues } from "@/modules/students/validation";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";

/** Edit a student without an app account (opened from the 16G actions sheet). */
export default function EditStudentRoute() {
  useRequireOrganizationOwner();
  const { studentId } = useLocalSearchParams<{ studentId: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<SchoolMember | null>(null);

  useEffect(() => {
    if (!studentId) return;
    // One read: the form keeps its own values while open.
    StudentRepository.findById(studentId)
      .then(setStudent)
      .catch((err: Error) => console.error("[EditStudent] Load error:", err));
  }, [studentId]);

  if (!student || !studentId) return <LoadingScreen />;

  const handleSubmit = async (data: StudentFormValues) => {
    await updateStudent(studentId, {
      displayName: data.displayName,
      email: data.email || undefined,
      phoneNumber: formatPhoneNumber(data.phoneNumber) ?? undefined,
    });
    router.back();
  };

  return (
    <StudentFormScreen
      initial={{
        displayName: student.displayName || "",
        email: student.email || "",
        phoneNumber: parsePhoneNumber(student.phoneNumber),
      }}
      onSubmit={handleSubmit}
    />
  );
}
