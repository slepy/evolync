import { EventParticipantsScreen } from "@/modules/events";
import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";

/**
 * Event participants (10D), opened from Manage on the details. Save
 * returns to the details.
 *
 * Route: /organization/events/[eventId]/participants
 */
export default function EventParticipantsRoute() {
  useRequireOrganizationOwner();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();

  return <EventParticipantsScreen eventId={eventId} onSaved={() => router.back()} />;
}
