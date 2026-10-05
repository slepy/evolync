import { SubScreenPage } from "@/core/components";
import {
  EventFormScreen,
  eventToForm,
  useEvent,
  useEventParticipantIds,
  useUpdateEvent,
  type CreateEventFormValues,
} from "@/modules/events";
import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";
import { useAudienceOptions } from "@/modules/trainings";
import { useStore } from "@/store";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { ActivityIndicator } from "react-native";
import { Text } from "tamagui";

/**
 * Edit event (10B). Save returns to the calendar the details were opened
 * from.
 *
 * Route: /organization/events/[eventId]/edit
 */
export default function EditEventScreen() {
  useRequireOrganizationOwner();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  const organization = useStore((s) => s.organization);
  const { event, isLoading } = useEvent(eventId);
  const { memberIds, isLoading: membersLoading } = useEventParticipantIds(eventId);
  const { schools, members } = useAudienceOptions(organization?.id);
  const { update } = useUpdateEvent(eventId, organization?.id);

  const initial = useMemo(
    () => (event && !membersLoading ? eventToForm(event, memberIds) : undefined),
    // Captured once the event and its participants are loaded; later syncs must not reset the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [event?.id, membersLoading],
  );

  /** Back past the details to the calendar (or wherever the details were opened from). */
  const returnToCalendar = () => {
    if (router.canDismiss()) router.dismiss(2);
    else router.replace("/organization/calendar" as any);
  };

  const handleSubmit = async (values: CreateEventFormValues) => {
    // Cleared optional texts are saved as empty (undefined would keep the old text).
    await update({ ...values, shortNote: values.shortNote ?? "", address: values.address ?? "" }, values.whitelistedMemberIds);
    returnToCalendar();
  };

  if (!initial || !event) {
    return (
      <SubScreenPage title={t("eventsEditTitle")}>
        {isLoading || membersLoading ? (
          <ActivityIndicator />
        ) : (
          <Text fontSize={14} fontWeight="$secondary" color="$neutralMuted" textAlign="center">
            {t("eventsNotFound")}
          </Text>
        )}
      </SubScreenPage>
    );
  }

  return (
    <EventFormScreen
      key={event.id}
      title={t("eventsEditTitle")}
      initial={initial}
      editing
      schools={schools}
      members={members}
      onSubmit={handleSubmit}
    />
  );
}
