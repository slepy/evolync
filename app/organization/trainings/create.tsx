import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";
import {
  TRAINING_MODE,
  TrainingFormScreen,
  createSingleTrainings,
  createTrainingSeries,
  initialTrainingForm,
  useAudienceOptions,
  useSchoolsWithAddress,
  type TrainingFormValues,
} from "@/modules/trainings";
import { useStore } from "@/store";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";

/**
 * New training (11A single / 11B recurring), opened from Add new in the
 * calendar: `?date=YYYY-MM-DD` is the selected day (past days fall back to
 * today), `?schoolId=` makes it a training of that school. Create returns
 * to the calendar.
 *
 * Route: /organization/trainings/create
 */
export default function CreateTrainingScreen() {
  useRequireOrganizationOwner();
  const router = useRouter();
  const { date, schoolId } = useLocalSearchParams<{ date?: string; schoolId?: string }>();
  const initial = useMemo(() => initialTrainingForm(date, schoolId), [date, schoolId]);
  const { organization, user } = useStore();
  const { schools, members } = useAudienceOptions(organization?.id);
  const { schools: schoolAddresses } = useSchoolsWithAddress(organization?.id);

  const handleSubmit = async (values: TrainingFormValues) => {
    if (!organization?.id || !user?.id) return;
    const common = { organizationId: organization.id, createdBy: user.id };
    if (values.mode === TRAINING_MODE.SINGLE) await createSingleTrainings({ ...values, ...common });
    else await createTrainingSeries({ ...values, ...common });
    if (router.canGoBack()) router.back();
    else router.replace(schoolId ? (`/school/${schoolId}/calendar` as any) : ("/organization/calendar" as any));
  };

  return (
    <TrainingFormScreen
      title={t("trainingsCreateTitle")}
      initial={initial}
      modes={[TRAINING_MODE.SINGLE, TRAINING_MODE.RECURRING]}
      schools={schools}
      members={members}
      schoolAddresses={schoolAddresses}
      onSubmit={handleSubmit}
    />
  );
}
