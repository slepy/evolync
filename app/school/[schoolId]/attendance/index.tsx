import { AttendanceSessionsScreen } from "@/modules/attendance";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";

/** Attendance sessions of one school (13A). Route: /school/[schoolId]/attendance */
export default function SchoolAttendanceScreen() {
  const { schoolId } = useLocalSearchParams<{ schoolId: string }>();
  const router = useRouter();

  return (
    <AttendanceSessionsScreen
      schoolId={schoolId}
      onSessionPress={(sessionId) => router.push(`/school/${schoolId}/attendance/${sessionId}`)}
      onAdd={(todaySessionId) =>
        router.push(
          todaySessionId
            ? `/school/${schoolId}/attendance/${todaySessionId}`
            : `/school/${schoolId}/attendance/create`,
        )
      }
    />
  );
}
