import { EventFormScreen, initialEventForm, useCreateEvent, type CreateEventFormValues } from "@/modules/events";
import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";
import { useAudienceOptions } from "@/modules/trainings";
import { useStore } from "@/store";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";

/**
 * New event (10A), opened from Add new in the organization calendar:
 * `?date=YYYY-MM-DD` is the selected day (past days fall back to today).
 * Create returns to the calendar.
 *
 * Route: /organization/events/create
 */
export default function CreateEventScreen() {
  useRequireOrganizationOwner();
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date?: string }>();
  const initial = useMemo(() => initialEventForm(date), [date]);
  const organization = useStore((s) => s.organization);
  const { schools, members } = useAudienceOptions(organization?.id);
  const { create } = useCreateEvent(organization?.id);

  const handleSubmit = async (values: CreateEventFormValues) => {
    await create(values, values.whitelistedMemberIds);
    if (router.canGoBack()) router.back();
    else router.replace("/organization/calendar" as any);
  };

  return (
    <EventFormScreen
      title={t("eventsCreateTitle")}
      initial={initial}
      schools={schools}
      members={members}
      onSubmit={handleSubmit}
      onManageTypes={() => router.push("/organization/events/types" as any)}
    />
  );
}
