import { StudentEventDetailsScreen } from "@/modules/events";
import { useStore } from "@/store";
import { useLocalSearchParams } from "expo-router";

/**
 * Event details for the student, opened from the calendar or their events
 * list: the event and their own Attending / Absent answer.
 *
 * Route: /user/events/[eventId]
 */
export default function UserEventDetailsScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const membership = useStore((state) => state.getActiveMembership());

  return <StudentEventDetailsScreen eventId={eventId} memberId={membership?.memberId} />;
}
