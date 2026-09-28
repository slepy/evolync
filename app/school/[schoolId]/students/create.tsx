import {
  Header,
  HeaderTitle,
  SubmitComponent,
} from "@/modules/core/components";
import { formatPhoneNumber } from "@/modules/core/utils/phoneHelpers";
import { useCreateStudent } from "@/modules/students/hooks";
import {
  StudentForm,
  StudentFormHandle,
} from "@/modules/students/components/StudentForm";
import { StudentFormValues } from "@/modules/students/validation";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView, YStack, Text } from "tamagui";
import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";

/**
 * Screen for creating a new student (Shadow User)
 *
 * Route: /school/[schoolId]/students/create
 *
 * Implements US-003a (PRD):
 * - Add student with only name (required) and email (optional)
 * - Student appears on list immediately (offline support)
 * - Works without internet connection
 */
export default function CreateStudentScreen() {
  useRequireOrganizationOwner();
  const { schoolId } = useLocalSearchParams<{ schoolId: string }>();
  const router = useRouter();
  const formRef = useRef<StudentFormHandle>(null);
  const { createStudent, isLoading, error, reset } = useCreateStudent();
  const insets = useSafeAreaInsets();

  if (!schoolId) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <YStack flex={1} justifyContent="center" alignItems="center">
          <Text color="$inkBlack">{t("studentsNoSchool")}</Text>
        </YStack>
      </View>
    );
  }

  const handleSuccess = () => {
    router.back();
  };

  const onSubmit = async (data: StudentFormValues) => {
    const student = await createStudent(schoolId, {
      displayName: data.displayName,
      email: data.email || undefined,
      phoneNumber: formatPhoneNumber(data.phoneNumber) ?? undefined,
    });
    if (student) {
      handleSuccess();
    }
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header
        onBack={() => router.back()}
        centerContent={<HeaderTitle text={t("studentCreateTitle")} />}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <YStack flex={1}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              padding: 20,
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
              <StudentForm
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
            title={t("studentCreateSubmit")}
          />
        </YStack>
      </KeyboardAvoidingView>
    </View>
  );
}
