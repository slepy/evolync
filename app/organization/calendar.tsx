import { Calendar } from "@/core/components";
import { EventListView } from "@/modules/events";
import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";
import { useStore } from "@/store";
import { useRouter } from "expo-router";

/**
 * Organization calendar (board 6): events and trainings of every school,
 * Add new offers an event or a training on the selected day. The List view
 * filters the organization's events by a date range and a type.
 *
 * Route: /organization/calendar
 */
export default function OrganizationCalendarScreen() {
  useRequireOrganizationOwner();
  const router = useRouter();
  const organization = useStore((s) => s.organization);

  return (
    <Calendar
      scope={organization ? { kind: "organization", organizationId: organization.id } : undefined}
      canAdd={["events", "trainings"]}
      onAdd={(kind, day) =>
        router.push(
          (kind === "events"
            ? `/organization/events/create?date=${day}`
            : `/organization/trainings/create?date=${day}`) as any,
        )
      }
      onItemPress={(item) =>
        router.push(
          (item.kind === "event"
            ? `/organization/events/${item.id}`
            : `/organization/trainings/${item.id}`) as any,
        )
      }
      listView={(range) => (
        <EventListView
          organizationId={organization?.id}
          initialRange={range}
          onEventPress={(eventId) => router.push(`/organization/events/${eventId}` as any)}
        />
      )}
    />
  );
}
