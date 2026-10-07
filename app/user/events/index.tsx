import { StudentEventsScreen } from "@/modules/events";
import { useStore } from "@/store";
import { useRouter } from "expo-router";

/**
 * Student's own events in the active school; a row opens the event details.
 *
 * Route: /user/events
 */
export default function UserEventsScreen() {
  const router = useRouter();
  const membership = useStore((state) => state.getActiveMembership());

  return (
    <StudentEventsScreen
      memberId={membership?.memberId}
      onEventPress={(eventId) => router.push(`/user/events/${eventId}` as any)}
    />
  );
}
