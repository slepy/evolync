import { Header, HeaderTitle, SubmitComponent } from "@/modules/core/components";
import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";
import {
  TRAINING_MODE,
  TrainingForm,
  createSingleTrainings,
  createTrainingSeries,
  useAudienceOptions,
  type TrainingFormHandle,
  type TrainingFormValues,
} from "@/modules/trainings";
import { useStore } from "@/store";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView, YStack } from "tamagui";

/**
 * "+ Add training": single dates or a recurring series.
 *
 * Route: /organization/trainings/create
 */
export default function CreateTrainingScreen() {
  useRequireOrganizationOwner();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const formRef = useRef<TrainingFormHandle>(null);
  const { organization, user } = useStore();
  const { schools, members } = useAudienceOptions(organization?.id);
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
      router.replace("/organization/trainings" as any);
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
                modes={[TRAINING_MODE.SINGLE]}
                schools={schools}
                members={members}
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
