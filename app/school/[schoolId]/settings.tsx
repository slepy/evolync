import School from "@/database/models/School";
import SchoolSettings from "@/database/models/SchoolSettings";
import { sync } from "@/database/sync";
import {
  Header,
  HeaderTitle,
  SubmitComponent,
} from "@/modules/core/components";
import { useDirtyFlag } from "@/modules/core/hooks";

import {
  SchoolSettingsForm,
  SchoolSettingsFormHandle,
} from "@/modules/school/components";
import {
  SchoolRepository,
  SchoolSettingsRepository,
} from "@/modules/school/repositories";
import {
  updateSchool,
  createOrUpdateSchoolSettings,
} from "@/modules/school/services";
import type { CombinedSchoolSettingsFormValues } from "@/modules/school/validation";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView, YStack } from "tamagui";

/**
 * Screen for editing school settings
 *
 * Route: /school/[schoolId]/settings
 *
 * Features:
 * - Section 1: Basic info (name, address)
 * - Section 2: Payment defaults (currency, amount)
 * - Offline support
 * - Auto-sync on load
 */
export default function SchoolSettingsScreen() {
  const { schoolId } = useLocalSearchParams<{ schoolId: string }>();
  const router = useRouter();
  const formRef = useRef<SchoolSettingsFormHandle>(null);
  const insets = useSafeAreaInsets();

  const [school, setSchool] = useState<School | null>(null);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isDirty, markDirty, reset: resetDirty } = useDirtyFlag();

  // Load data on mount
  useEffect(() => {
    if (!schoolId) return;

    const loadData = async () => {
      try {
        // Load from local database via repositories
        const schoolRecord = await SchoolRepository.findById(schoolId);
        const settingsRecord =
          await SchoolSettingsRepository.findBySchoolId(schoolId);

        setSchool(schoolRecord);
        setSettings(settingsRecord);
      } catch (err) {
        console.error("Error loading school settings:", err);
        setError(t("errorLoadingFailed"));
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, [schoolId]);

  const handleSubmit = useCallback(
    async (data: CombinedSchoolSettingsFormValues) => {
      if (!schoolId) return;

      try {
        setIsSubmitting(true);
        setError(null);

        // Update school basic info
        await updateSchool(schoolId, {
          name: data.name,
          address: data.address,
        });

        // Update/create school settings
        await createOrUpdateSchoolSettings(schoolId, {
          defaultCurrency: data.defaultCurrency,
          defaultPaymentAmount: data.defaultPaymentAmount,
        });

        // Trigger sync to push changes to Supabase
        sync().catch((err) => {
          console.error("[SchoolSettings] Sync failed:", err);
        });

        resetDirty();
        router.back();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : t("errorSaveFailed");
        setError(errorMessage);
        console.error("Error saving school settings:", err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [schoolId, router],
  );

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  if (!school) {
    return null;
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header
        onBack={() => router.back()}
        centerContent={<HeaderTitle text={t("settingsTitle")} />}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <YStack flex={1}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              padding: 16,
              paddingBottom: 100,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <YStack maxWidth={500} width="100%" alignSelf="center" gap="$4">
              <SchoolSettingsForm
                ref={formRef}
                initialData={{
                  name: school.name,
                  address: school.address,
                  defaultCurrency: settings?.defaultCurrency,
                  defaultPaymentAmount: settings?.defaultPaymentAmount,
                }}
                onSubmit={handleSubmit}
                isLoading={isSubmitting}
                error={error}
                onResetError={resetError}
                onDirtyChange={(dirty) => { if (dirty) markDirty(); }}
              />
            </YStack>
          </ScrollView>

          {isDirty && (
            <SubmitComponent
              onPress={() => formRef.current?.submit()}
              isLoading={isSubmitting}
              disabled={isSubmitting}
            />
          )}
        </YStack>
      </KeyboardAvoidingView>
    </View>
  );
}
