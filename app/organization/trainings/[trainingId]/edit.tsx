import { SubScreenPage } from "@/core/components";
import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";
import {
  TRAINING_EDIT_SCOPE,
  TRAINING_MODE,
  TrainingFormScreen,
  seriesToForm,
  timestampToDay,
  trainingToForm,
  updateSeriesFrom,
  updateTraining,
  useAudienceOptions,
  useSchoolsWithAddress,
  useTraining,
  useTrainingInvitees,
  type TrainingFormValues,
} from "@/modules/trainings";
import { useStore } from "@/store";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { ActivityIndicator } from "react-native";
import { Text } from "tamagui";

/**
 * Edit one training ("this training only") or the series from this training
 * on ("this and following", 11C). Save returns to the calendar the details
 * were opened from.
 *
 * Route: /organization/trainings/[trainingId]/edit?scope=this|following
 */
export default function EditTrainingScreen() {
  useRequireOrganizationOwner();
  const { trainingId, scope } = useLocalSearchParams<{ trainingId: string; scope?: string }>();
  const router = useRouter();
  const { organization, user } = useStore();
  const { training, series, isLoading } = useTraining(trainingId);
  const { invitees, isLoading: inviteesLoading } = useTrainingInvitees(trainingId);
  const { schools, members } = useAudienceOptions(organization?.id);
  const { schools: schoolAddresses } = useSchoolsWithAddress(organization?.id);

  const following = scope === TRAINING_EDIT_SCOPE.FOLLOWING && !!series;

  const initial = useMemo(() => {
    if (!training || inviteesLoading) return undefined;
    const day = timestampToDay(training.date);
    return following && series
      ? seriesToForm(series, day)
      : trainingToForm(training, invitees.map((i) => i.schoolMemberId));
    // Captured once the training and its invitees are loaded; later syncs must not reset the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [training?.id, series?.id, following, inviteesLoading]);

  /** Back past the details to the calendar (or wherever the details were opened from). */
  const returnToCalendar = () => {
    if (router.canDismiss()) router.dismiss(2);
    else router.replace("/organization/calendar" as any);
  };

  const handleSubmit = async (values: TrainingFormValues) => {
    if (!training || !organization?.id || !user?.id) return;
    if (values.mode === TRAINING_MODE.RECURRING) {
      await updateSeriesFrom(training.id, { ...values, organizationId: organization.id, createdBy: user.id });
    } else {
      await updateTraining(training.id, {
        name: values.name,
        location: values.location,
        visibility: values.visibility,
        schoolId: values.schoolId,
        inviteeIds: values.inviteeIds,
        date: values.dates[0],
        startTime: values.startTime,
        endTime: values.endTime,
      });
    }
    returnToCalendar();
  };

  const title = following ? t("trainingsEditSeriesTitle") : t("trainingsEditTitle");

  if (!initial || !training) {
    return (
      <SubScreenPage title={title}>
        {isLoading || inviteesLoading ? (
          <ActivityIndicator />
        ) : (
          <Text fontSize={14} fontWeight="$secondary" color="$neutralMuted" textAlign="center">
            {t("trainingsErrorNotFound")}
          </Text>
        )}
      </SubScreenPage>
    );
  }

  return (
    <TrainingFormScreen
      key={`${training.id}-${following}`}
      title={title}
      initial={initial}
      modes={[following ? TRAINING_MODE.RECURRING : TRAINING_MODE.SINGLE]}
      editing
      minStartDate={following ? timestampToDay(training.date) : undefined}
      schools={schools}
      members={members}
      schoolAddresses={schoolAddresses}
      onSubmit={handleSubmit}
    />
  );
}
