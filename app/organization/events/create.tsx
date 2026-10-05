import {
  Header,
  HeaderTitle,
  SubmitComponent,
} from "@/modules/core/components";
import {
  EventForm,
  type EventFormHandle,
  useCreateEvent,
  type CreateEventFormValues,
} from "@/modules/events";
import { SchoolRepository } from "@/modules/school/repositories";
import { isValidDay } from "@/modules/trainings";
import { StudentRepository } from "@/modules/students/repositories";
import { useStore } from "@/store";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState, useEffect } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView, YStack } from "tamagui";
import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";

/**
 * Screen for creating a new event
 *
 * Route: /organization/events/create
 *
 * Features:
 * - Event form with all fields
 * - School selector for visibility
 * - Offline support
 * - Auto-navigation on success
 * - `?date=YYYY-MM-DD` (from the calendar) fills in the start date
 */
export default function CreateEventScreen() {
  useRequireOrganizationOwner();
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date?: string }>();
  const initialStartDate = date && isValidDay(date) ? date : undefined;
  const formRef = useRef<EventFormHandle>(null);
  const { organization } = useStore();
  const insets = useSafeAreaInsets();

  const [schools, setSchools] = useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [members, setMembers] = useState<
    Array<{ id: string; displayName: string; schoolName?: string }>
  >([]);

  const { create, isCreating, error } = useCreateEvent(organization?.id);
  const [formError, setFormError] = useState<string | null>(null);

  // Load schools for the organization via repository
  useEffect(() => {
    if (!organization?.id) return;

    const subscription = SchoolRepository.observeByOrganizationId(
      organization.id,
    ).subscribe({
      next: (result) => {
        setSchools(result.map((s) => ({ id: s.id, name: s.name })));
      },
      error: (err) => {
        console.error("[CreateEventScreen] Schools load error:", err);
      },
    });

    return () => subscription.unsubscribe();
  }, [organization?.id]);

  // Load members for whitelist selection
  useEffect(() => {
    if (schools.length === 0) {
      setMembers([]);
      return;
    }

    const schoolIds = schools.map((s) => s.id);
    const schoolMap = new Map(schools.map((s) => [s.id, s.name]));

    const subscription = StudentRepository.observeBySchoolIds(
      schoolIds,
    ).subscribe({
      next: (result) => {
        setMembers(
          result.map((m) => ({
            id: m.id,
            displayName: m.displayName || m.email || t("unknown"),
            schoolName: schoolMap.get(m.schoolId),
          })),
        );
      },
      error: (err) => {
        console.error("[CreateEventScreen] Members load error:", err);
      },
    });

    return () => subscription.unsubscribe();
  }, [schools]);

  const handleSubmit = async (data: CreateEventFormValues) => {
    try {
      setFormError(null);
      const event = await create(data, data.whitelistedMemberIds);
      router.replace(`/organization/events/${event.id}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("errorCreateFailed");
      setFormError(message);
    }
  };

  const handleResetError = () => {
    setFormError(null);
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header
        onBack={() => router.back()}
        centerContent={<HeaderTitle text={t("eventsTitle")} />}
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
              <EventForm
                ref={formRef}
                initialStartDate={initialStartDate}
                schools={schools}
                members={members}
                onSubmit={handleSubmit}
                isLoading={isCreating}
                error={formError || error}
                onResetError={handleResetError}
              />
            </YStack>
          </ScrollView>

          {/* Floating Submit Button */}
          <SubmitComponent
            onPress={() => formRef.current?.submit()}
            isLoading={isCreating}
            disabled={isCreating}
            title={t("eventsCreateSubmit")}
          />
        </YStack>
      </KeyboardAvoidingView>
    </View>
  );
}
