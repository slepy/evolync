import { AttendanceSessionScreen } from "@/modules/attendance";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";

/** Attendance of one session (13B). Route: /school/[schoolId]/attendance/[sessionId] */
export default function SchoolAttendanceSessionScreen() {
  const { schoolId, sessionId } = useLocalSearchParams<{ schoolId: string; sessionId: string }>();
  const router = useRouter();

  return <AttendanceSessionScreen schoolId={schoolId} sessionId={sessionId} onSaved={() => router.back()} />;
}
