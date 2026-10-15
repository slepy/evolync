import { EventTypesListScreen } from "@/modules/events";
import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";
import React from "react";

/**
 * Event types of the organization: add, rename, delete. Opened from the
 * Event type sheet of the event form.
 *
 * Route: /organization/events/types
 */
export default function EventTypesRoute() {
  useRequireOrganizationOwner();
  return <EventTypesListScreen />;
}
