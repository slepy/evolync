import { Calendar } from "@/core/components";
import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";
import { useLocalSearchParams, useRouter } from "expo-router";

/**
 * School calendar (board 6A): the trainings that concern this school, red
 * Add new opens a training on the selected day for this school.
 *
 * Route: /school/[schoolId]/calendar
 */
export default function SchoolCalendarScreen() {
  useRequireOrganizationOwner();
  const router = useRouter();
  const { schoolId } = useLocalSearchParams<{ schoolId: string }>();

  return (
    <Calendar
      scope={schoolId ? { kind: "school", schoolId } : undefined}
      show={["trainings"]}
      canAdd={["trainings"]}
      onAdd={(_, day) => router.push(`/organization/trainings/create?date=${day}&schoolId=${schoolId}` as any)}
      onItemPress={(item) => router.push(`/organization/trainings/${item.id}?schoolId=${schoolId}` as any)}
    />
  );
}
