import { Header, HeaderTitle, SubmitComponent } from "@/modules/core/components";
import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";
import { TRAINING_VISIBILITY } from "@/database/models/Training";
import {
  TRAINING_MODE,
  TrainingForm,
  addMonths,
  createSingleTrainings,
  createTrainingSeries,
  isValidDay,
  localToday,
  useAudienceOptions,
  useSchoolsWithAddress,
  type TrainingFormHandle,
  type TrainingFormState,
  type TrainingFormValues,
} from "@/modules/trainings";
import { useStore } from "@/store";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView, YStack } from "tamagui";

/**
 * "+ Add training": single dates or a recurring series.
 * From the calendar: `?date=YYYY-MM-DD` is the first date (past days fall
 * back to today) and `?schoolId=` makes it a training of that school; on
 * save it returns to the calendar.
 *
 * Route: /organization/trainings/create
 */
export default function CreateTrainingScreen() {
  useRequireOrganizationOwner();
  const router = useRouter();
  const { date, schoolId } = useLocalSearchParams<{ date?: string; schoolId?: string }>();
  const insets = useSafeAreaInsets();
  const prefill = useMemo((): Partial<TrainingFormState> | undefined => {
    if (!date && !schoolId) return undefined;
    const today = localToday();
    const day = date && isValidDay(date) && date >= today ? date : today;
    return {
      dates: [day],
      startDate: day,
      endDate: addMonths(day, 3),
      ...(schoolId ? { visibility: TRAINING_VISIBILITY.SCHOOL, schoolId } : {}),
    };
  }, [date, schoolId]);
  const formRef = useRef<TrainingFormHandle>(null);
  const { organization, user } = useStore();
  const { schools, members } = useAudienceOptions(organization?.id);
  const { schools: schoolAddresses } = useSchoolsWithAddress(organization?.id);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: TrainingFormValues) => {
    if (!organization?.id || !user?.id) return;
    try {
      setIsSaving(true);
      setError(null);
      const common = { organizationId: organization.id, createdBy: user.id };
      if (values.mode === TRAINING_MODE.SINGLE) {
        await createSingleTrainings({ ...values, ...common });
      } else {
        await createTrainingSeries({ ...values, ...common });
      }
      if (prefill) router.back();
      else router.replace("/organization/trainings" as any);
    } catch (err) {
      setError(err instanceof Error ? err.message : "errorCreateFailed");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header onBack={() => router.back()} centerContent={<HeaderTitle text={t("trainingsCreateTitle")} />} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <YStack flex={1}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 100 }}
            keyboardShouldPersistTaps="handled"
          >
            <YStack maxWidth={500} width="100%" alignSelf="center" gap="$4">
              <TrainingForm
                ref={formRef}
                prefill={prefill}
                modes={[TRAINING_MODE.SINGLE, TRAINING_MODE.RECURRING]}
                schools={schools}
                members={members}
                schoolAddresses={schoolAddresses}
                onSubmit={handleSubmit}
                isLoading={isSaving}
                error={error}
                onResetError={() => setError(null)}
              />
            </YStack>
          </ScrollView>
          <SubmitComponent
            onPress={() => formRef.current?.submit()}
            isLoading={isSaving}
            disabled={isSaving}
            title={t("trainingsCreateSubmit")}
          />
        </YStack>
      </KeyboardAvoidingView>
    </View>
  );
}
