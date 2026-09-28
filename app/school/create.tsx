import {
  Header,
  HeaderTitle,
  SubmitComponent,
} from "@/modules/core/components";

import { useCreateSchool } from "@/modules/school";
import {
  CreateSchoolForm,
  CreateSchoolFormHandle,
} from "@/modules/school/components/CreateSchoolForm";
import { CreateSchoolFormValues } from "@/modules/school/validation";
import { useRouter } from "expo-router";
import React, { useRef } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView, YStack } from "tamagui";
import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";

/**
 * Screen for creating a new school
 *
 * Route: /school/create
 *
 * Features:
 * - Form with name input
 * - Validation (Zod)
 * - Offline support
 * - Optimistic UI (immediate feedback)
 * - Auto-navigation on success
 */
export default function CreateSchoolScreen() {
  useRequireOrganizationOwner();
  const router = useRouter();
  const formRef = useRef<CreateSchoolFormHandle>(null);
  const { createSchool, isLoading, error, reset } = useCreateSchool();
  const insets = useSafeAreaInsets();

  const handleSuccess = (schoolId: string) => {
    // Navigate to the newly created school's dashboard
    router.replace(`/school/${schoolId}/dashboard`);
  };

  const onSubmit = async (data: CreateSchoolFormValues) => {
    const school = await createSchool(data);
    if (school) {
      handleSuccess(school.id);
    }
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header
        onBack={() => router.back()}
        centerContent={<HeaderTitle text={t("schoolCreateTitle")} />}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <YStack flex={1}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center",
              padding: 20,
              paddingBottom: 100, // Extra padding
            }}
            keyboardShouldPersistTaps="handled"
          >
            <YStack
              maxWidth={500}
              width="100%"
              alignSelf="center"
              gap="$4"
              paddingVertical="$6"
            >
              <CreateSchoolForm
                ref={formRef}
                onSubmit={onSubmit}
                isLoading={isLoading}
                error={error}
                onResetError={reset}
              />
            </YStack>
          </ScrollView>

          {/* Floating Submit Button */}
          <SubmitComponent
            onPress={() => formRef.current?.submit()}
            isLoading={isLoading}
            disabled={isLoading}
            title={t("schoolCreateSubmit")}
          />
        </YStack>
      </KeyboardAvoidingView>
    </View>
  );
}
