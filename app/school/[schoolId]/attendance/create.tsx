import { AttendanceCreateScreen } from "@/modules/attendance";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";

/** New session for today or a past date (13C / 13C1). Route: /school/[schoolId]/attendance/create */
export default function SchoolAttendanceCreateScreen() {
  const { schoolId } = useLocalSearchParams<{ schoolId: string }>();
  const router = useRouter();

  return (
    <AttendanceCreateScreen
      schoolId={schoolId}
      onCreated={() => router.back()}
      onOpenSession={(sessionId) => router.replace(`/school/${schoolId}/attendance/${sessionId}`)}
    />
  );
}
