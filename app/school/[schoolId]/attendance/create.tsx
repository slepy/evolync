import { AttendanceCreateScreen } from "@/modules/attendance";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";

/** New session for today (13C). Route: /school/[schoolId]/attendance/create */
export default function SchoolAttendanceCreateScreen() {
  const { schoolId } = useLocalSearchParams<{ schoolId: string }>();
  const router = useRouter();

  return <AttendanceCreateScreen schoolId={schoolId} onCreated={() => router.back()} />;
}
