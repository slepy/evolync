import { Calendar } from "@/core/components";
import { useStore } from "@/store";
import { useRouter } from "expo-router";

/**
 * Student calendar: the events the student takes part in and their school's
 * trainings, read-only (no Add new). An event row opens the student's events
 * list, where participation is confirmed.
 *
 * Route: /user/calendar
 */
export default function UserCalendarScreen() {
  const router = useRouter();
  const membership = useStore((s) => s.getActiveMembership());

  return (
    <Calendar
      scope={
        membership ? { kind: "student", memberId: membership.memberId, schoolId: membership.schoolId } : undefined
      }
      onItemPress={() => router.push("/user/events")}
      pressable={["events"]}
    />
  );
}
