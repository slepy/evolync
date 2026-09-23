import {
  Header,
  HeaderTitle,
  SubmitComponent,
} from "@/modules/core/components";
import {
  EventForm,
  type EventFormHandle,
  EventParticipantRepository,
  useEvent,
  useUpdateEvent,
  type CreateEventFormValues,
} from "@/modules/events";
import { useDirtyFlag } from "@/modules/core/hooks";
import { SchoolRepository } from "@/modules/school/repositories";
import { StudentRepository } from "@/modules/students/repositories";
import { useStore } from "@/store";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState, useEffect } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView, Text, YStack } from "tamagui";

/**
 * Screen for editing an event
 *
 * Route: /organization/events/[eventId]/edit
 *
 * Features:
 * - Pre-filled event form
 * - School selector for visibility
 * - Offline support
 * - Auto-navigation on success
 */
export default function EditEventScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  const formRef = useRef<EventFormHandle>(null);
  const { organization } = useStore();
  const { isDirty, markDirty, reset: resetDirty } = useDirtyFlag();
  const insets = useSafeAreaInsets();

  const [schools, setSchools] = useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [members, setMembers] = useState<
    Array<{ id: string; displayName: string; schoolName?: string }>
  >([]);
  const [participantIds, setParticipantIds] = useState<string[]>([]);

  const {
    event,
    isLoading: isLoadingEvent,
    error: loadError,
  } = useEvent(eventId);
  const {
    update,
    isUpdating,
    error: updateError,
  } = useUpdateEvent(eventId, organization?.id);
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
        console.error("[EditEventScreen] Schools load error:", err);
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
        console.error("[EditEventScreen] Members load error:", err);
      },
    });

    return () => subscription.unsubscribe();
  }, [schools]);

  // Load current event participants (for whitelist editing)
  useEffect(() => {
    if (!eventId) {
      setParticipantIds([]);
      return;
    }

    const subscription = EventParticipantRepository.observeByEventId(
      eventId,
    ).subscribe({
      next: (participants) => {
        setParticipantIds(participants.map((p) => p.schoolMemberId));
      },
      error: (err) => {
        console.error("[EditEventScreen] Participants load error:", err);
      },
    });

    return () => subscription.unsubscribe();
  }, [eventId]);

  const handleSubmit = async (data: CreateEventFormValues) => {
    try {
      setFormError(null);
      await update(data, data.whitelistedMemberIds);
      resetDirty();
      router.back();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("errorUpdateFailed");
      setFormError(message);
    }
  };

  const handleResetError = () => {
    setFormError(null);
  };

  if (loadError || !event) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <Header
          onBack={() => router.back()}
          centerContent={<HeaderTitle text={t("eventsEditTitleTitle")} />}
        />
        <YStack
          flex={1}
          justifyContent="center"
          alignItems="center"
          padding="$4"
        >
          <Text color="$imperialRed" textAlign="center">
            {loadError || t("eventsNotFound")}
          </Text>
        </YStack>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header
        onBack={() => router.back()}
        centerContent={<HeaderTitle text={t("eventsEditTitleTitle")} />}
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
                initialData={event}
                initialParticipantIds={participantIds}
                schools={schools}
                members={members}
                onSubmit={handleSubmit}
                isLoading={isUpdating}
                error={formError || updateError}
                onResetError={handleResetError}
                onDirtyChange={(dirty) => { if (dirty) markDirty(); }}
              />
            </YStack>
          </ScrollView>

          {/* Floating Submit Button - only show when form has changes */}
          {isDirty && (
            <SubmitComponent
              onPress={() => formRef.current?.submit()}
              isLoading={isUpdating}
              disabled={isUpdating}
              title={t("save")}
            />
          )}
        </YStack>
      </KeyboardAvoidingView>
    </View>
  );
}
