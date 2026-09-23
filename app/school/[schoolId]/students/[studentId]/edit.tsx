import {
  Header,
  HeaderTitle,
  SubmitComponent,
} from "@/modules/core/components";
import { useDirtyFlag } from "@/modules/core/hooks";
import { LoadingScreen } from "@/modules/core/components/LoadingScreen";
import { StudentRepository } from "@/modules/students/repositories";
import { updateStudent } from "@/modules/students/services";
import {
  StudentForm,
  StudentFormHandle,
} from "@/modules/students/components/StudentForm";
import type { StudentFormValues } from "@/modules/students/validation";
import {
  formatPhoneNumber,
  parsePhoneNumber,
} from "@/modules/core/utils/phoneHelpers";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView, YStack } from "tamagui";
import SchoolMember from "@/database/models/SchoolMember";

export default function EditStudentScreen() {
  const { schoolId, studentId } = useLocalSearchParams<{
    schoolId: string;
    studentId: string;
  }>();
  const router = useRouter();
  const formRef = useRef<StudentFormHandle>(null);
  const insets = useSafeAreaInsets();

  const [student, setStudent] = useState<SchoolMember | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isDirty, markDirty, reset: resetDirty } = useDirtyFlag();

  useEffect(() => {
    if (!studentId) return;
    const subscription = StudentRepository.observeById(studentId).subscribe({
      next: (found: SchoolMember) => setStudent(found),
      error: (err: Error) => console.error("[EditStudent] observe error:", err),
    });
    return () => subscription.unsubscribe();
  }, [studentId]);

  if (!student) {
    return <LoadingScreen showLogo={false} spinnerColor="$purple10" />;
  }

  const onSubmit = async (data: StudentFormValues) => {
    if (!studentId) return;
    setIsLoading(true);
    setError(null);
    try {
      await updateStudent(studentId, {
        displayName: data.displayName,
        email: data.email || undefined,
        phoneNumber: formatPhoneNumber(data.phoneNumber) ?? undefined,
      });
      resetDirty();
      router.back();
    } catch {
      setError(t("studentEditError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header
        onBack={() => router.back()}
        centerContent={<HeaderTitle text={t("studentEditTitle")} />}
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
              paddingBottom: 100,
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
                defaultValues={{
                  displayName: student.displayName || "",
                  email: student.email || "",
                  phoneNumber: parsePhoneNumber(student.phoneNumber),
                }}
                onSubmit={onSubmit}
                isLoading={isLoading}
                error={error}
                onResetError={() => setError(null)}
                onDirtyChange={(dirty) => { if (dirty) markDirty(); }}
              />
            </YStack>
          </ScrollView>

          {isDirty && (
            <SubmitComponent
              onPress={() => formRef.current?.submit()}
              isLoading={isLoading}
              disabled={isLoading}
              title={t("save")}
            />
          )}
        </YStack>
      </KeyboardAvoidingView>
    </View>
  );
}
