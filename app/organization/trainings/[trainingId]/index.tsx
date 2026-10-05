import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";
import { TrainingDetailsScreen } from "@/modules/trainings";
import { useStore } from "@/store";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";

/**
 * Training details (11D), opened from the calendar. Edit opens the form for
 * the chosen scope; delete returns to the calendar.
 *
 * Route: /organization/trainings/[trainingId]?schoolId=… (schoolId narrows
 * invitees to that school, when opened from a school calendar)
 */
export default function TrainingDetailsRoute() {
  useRequireOrganizationOwner();
  const { trainingId, schoolId } = useLocalSearchParams<{ trainingId: string; schoolId?: string }>();
  const router = useRouter();
  const organization = useStore((s) => s.organization);

  return (
    <TrainingDetailsScreen
      trainingId={trainingId}
      schoolId={schoolId}
      organizationId={organization?.id}
      onEdit={(scope) => router.push(`/organization/trainings/${trainingId}/edit?scope=${scope}` as any)}
      onDeleted={() => {
        if (router.canGoBack()) router.back();
        else router.replace("/organization/calendar" as any);
      }}
    />
  );
}
