import { EventDetailsScreen } from "@/modules/events";
import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";

/**
 * Event details (10C), opened from the organization calendar. Edit and
 * Manage open their screens; delete returns to the calendar.
 *
 * Route: /organization/events/[eventId]
 */
export default function EventDetailsRoute() {
  useRequireOrganizationOwner();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();

  return (
    <EventDetailsScreen
      eventId={eventId}
      onEdit={() => router.push(`/organization/events/${eventId}/edit` as any)}
      onManageParticipants={() => router.push(`/organization/events/${eventId}/participants` as any)}
      onDeleted={() => {
        if (router.canGoBack()) router.back();
        else router.replace("/organization/calendar" as any);
      }}
    />
  );
}
