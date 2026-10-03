import { Header, HeaderTitle, LoadingScreen, SubmitComponent } from "@/modules/core/components";
import { useDirtyFlag } from "@/modules/core/hooks";
import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";
import {
  TRAINING_EDIT_SCOPE,
  TRAINING_MODE,
  TrainingForm,
  parseJsonArray,
  timestampToDay,
  updateSeriesFrom,
  updateTraining,
  useAudienceOptions,
  useSchoolsWithAddress,
  useTraining,
  useTrainingInvitees,
  type SeriesRule,
  type TrainingFormHandle,
  type TrainingFormState,
  type TrainingFormValues,
} from "@/modules/trainings";
import { useStore } from "@/store";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView, Text, YStack } from "tamagui";

/**
 * Edit one training ("this training only") or the series from this training
 * on ("this and following").
 *
 * Route: /organization/trainings/[trainingId]/edit?scope=this|following
 */
export default function EditTrainingScreen() {
  useRequireOrganizationOwner();
  const { trainingId, scope } = useLocalSearchParams<{ trainingId: string; scope?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const formRef = useRef<TrainingFormHandle>(null);
  const { organization, user } = useStore();
  const { training, series, isLoading } = useTraining(trainingId);
  const { invitees, isLoading: inviteesLoading } = useTrainingInvitees(trainingId);
  const { schools, members } = useAudienceOptions(organization?.id);
  const { schools: schoolAddresses } = useSchoolsWithAddress(organization?.id);
  const { isDirty, markDirty } = useDirtyFlag();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const following = scope === TRAINING_EDIT_SCOPE.FOLLOWING && !!series;

  const initialValues = useMemo((): Partial<TrainingFormState> | undefined => {
    if (!training) return undefined;
    const day = timestampToDay(training.date);
    if (following && series) {
      const seriesEnd = timestampToDay(series.endDate);
      return {
        mode: TRAINING_MODE.RECURRING,
        name: series.name,
        location: series.location ?? "",
        visibility: series.visibility,
        schoolId: series.schoolId ?? undefined,
        inviteeIds: parseJsonArray(series.inviteeIds),
        startDate: day,
        endDate: seriesEnd < day ? day : seriesEnd,
        rules: parseJsonArray<SeriesRule>(series.rules),
      };
    }
    return {
      mode: TRAINING_MODE.SINGLE,
      name: training.name,
      location: training.location ?? "",
      visibility: training.visibility,
      schoolId: training.schoolId ?? undefined,
      inviteeIds: invitees.map((i) => i.schoolMemberId),
      dates: [day],
      startTime: training.startTime,
      endTime: training.endTime,
    };
    // Initial values are captured once the training and invitees are loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [training?.id, series?.id, following, inviteesLoading]);

  const handleSubmit = async (values: TrainingFormValues) => {
    if (!training || !organization?.id || !user?.id) return;
    try {
      setIsSaving(true);
      setError(null);
      if (values.mode === TRAINING_MODE.RECURRING) {
        await updateSeriesFrom(training.id, { ...values, organizationId: organization.id, createdBy: user.id });
        router.replace("/organization/trainings" as any);
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
        router.back();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "errorUpdateFailed");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || inviteesLoading) return <LoadingScreen />;

  const title = following ? t("trainingsEditSeriesTitle") : t("trainingsEditTitle");

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header onBack={() => router.back()} centerContent={<HeaderTitle text={title} />} />
      {!training || !initialValues ? (
        <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
          <Text color="$textMuted">{t("trainingsErrorNotFound")}</Text>
        </YStack>
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <YStack flex={1}>
            <ScrollView
              contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 100 }}
              keyboardShouldPersistTaps="handled"
            >
              <YStack maxWidth={500} width="100%" alignSelf="center" gap="$4">
                <TrainingForm
                  ref={formRef}
                  initialValues={initialValues}
                  modes={[following ? TRAINING_MODE.RECURRING : TRAINING_MODE.SINGLE]}
                  maxDates={following ? undefined : 1}
                  schools={schools}
                  members={members}
                  schoolAddresses={schoolAddresses}
                  onSubmit={handleSubmit}
                  isLoading={isSaving}
                  error={error}
                  onResetError={() => setError(null)}
                  onDirtyChange={(dirty) => dirty && markDirty()}
                />
              </YStack>
            </ScrollView>
            {isDirty && (
              <SubmitComponent
                onPress={() => formRef.current?.submit()}
                isLoading={isSaving}
                disabled={isSaving}
                title={t("save")}
              />
            )}
          </YStack>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}
