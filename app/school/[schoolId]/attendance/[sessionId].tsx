import { AttendanceSessionScreen } from "@/modules/attendance";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";

/** Attendance of one session (13B). Route: /school/[schoolId]/attendance/[sessionId] */
export default function SchoolAttendanceSessionScreen() {
  const { schoolId, sessionId } = useLocalSearchParams<{ schoolId: string; sessionId: string }>();
  const router = useRouter();

  // To the sessions list even when the session was opened from the dashboard tile's "+" (Create → Open):
  // back() would land on the school dashboard there.
  return (
    <AttendanceSessionScreen
      schoolId={schoolId}
      sessionId={sessionId}
      onSaved={() => router.dismissTo(`/school/${schoolId}/attendance`)}
    />
  );
}
