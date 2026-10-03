import { ErrorBanner, TextInput } from "@/modules/core/components";
import { TRAINING_VISIBILITY, type TrainingVisibility } from "@/database/models/Training";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { forwardRef, useEffect, useImperativeHandle } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { Text, XStack, YStack } from "tamagui";

import type { SeriesRule } from "../types/dto";
import { TRAINING_MODE, type TrainingMode } from "../types/enums";
import { localToday } from "../types/helpers";
import { trainingSchema, type TrainingFormValues } from "../validation";
import { MultiDateCalendar } from "./MultiDateCalendar";
import { TimeField } from "./TimeField";
import { TrainingAudienceFields, type AudienceMember } from "./TrainingAudienceFields";

// ============================================================================
// Types
// ============================================================================

/** Flat form state; the resolver narrows it to TrainingFormValues on submit. */
export interface TrainingFormState {
  mode: TrainingMode;
  name: string;
  location: string;
  visibility: TrainingVisibility;
  schoolId?: string;
  inviteeIds: string[];
  // single
  dates: string[];
  startTime: string;
  endTime: string;
  // recurring
  startDate: string;
  endDate: string;
  rules: SeriesRule[];
}

export interface TrainingFormHandle {
  submit: () => void;
  isDirty: boolean;
}

interface TrainingFormProps {
  initialValues?: Partial<TrainingFormState>;
  /** Modes the user may pick; one mode hides the switch (edits). */
  modes?: TrainingMode[];
  /** Cap on selectable single dates (1 for a "this training only" edit). */
  maxDates?: number;
  schools: Array<{ id: string; name: string }>;
  members: AudienceMember[];
  onSubmit: (values: TrainingFormValues) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  onResetError: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}

const defaultState = (): TrainingFormState => {
  const today = localToday();
  return {
    mode: TRAINING_MODE.SINGLE,
    name: "",
    location: "",
    visibility: TRAINING_VISIBILITY.ORGANIZATION,
    schoolId: undefined,
    inviteeIds: [],
    dates: [],
    startTime: "18:00",
    endTime: "19:30",
    startDate: today,
    endDate: today,
    rules: [],
  };
};

const translate = (message?: string) => (message ? t(message) : undefined);

// ============================================================================
// TrainingForm
// ============================================================================

export const TrainingForm = forwardRef<TrainingFormHandle, TrainingFormProps>(
  (
    {
      initialValues,
      modes = [TRAINING_MODE.SINGLE],
      maxDates,
      schools,
      members,
      onSubmit,
      isLoading,
      error,
      onResetError,
      onDirtyChange,
    },
    ref,
  ) => {
    const {
      control,
      handleSubmit,
      setValue,
      formState: { errors, isDirty },
    } = useForm<TrainingFormState>({
      resolver: zodResolver(trainingSchema) as unknown as Resolver<TrainingFormState>,
      defaultValues: { ...defaultState(), ...initialValues },
    });

    const mode = useWatch({ control, name: "mode" });
    const visibility = useWatch({ control, name: "visibility" });
    const schoolId = useWatch({ control, name: "schoolId" });
    const inviteeIds = useWatch({ control, name: "inviteeIds" });
    const dates = useWatch({ control, name: "dates" });
    const startTime = useWatch({ control, name: "startTime" });
    const endTime = useWatch({ control, name: "endTime" });

    const set = <K extends keyof TrainingFormState>(key: K, value: TrainingFormState[K]) =>
      setValue(key, value as never, { shouldDirty: true, shouldValidate: false });

    useImperativeHandle(ref, () => ({
      submit: handleSubmit((values) => onSubmit(values as unknown as TrainingFormValues)),
      isDirty,
    }));

    useEffect(() => {
      onDirtyChange?.(isDirty);
    }, [isDirty, onDirtyChange]);

    return (
      <YStack gap="$4" width="100%">
        {error && (
          <ErrorBanner
            title={initialValues ? t("errorUpdateFailed") : t("errorCreateFailed")}
            message={t(error)}
            onDismiss={onResetError}
          />
        )}

        <TextInput
          control={control}
          name="name"
          label={t("fieldName")}
          placeholder={t("trainingsNamePlaceholder")}
          error={translate(errors.name?.message)}
          disabled={isLoading}
          autoCapitalize="sentences"
          maxLength={60}
        />

        {modes.length > 1 && (
          <XStack backgroundColor="$fillSubtle" borderRadius="$4" padding="$1" gap="$1">
            {modes.map((option) => {
              const active = mode === option;
              return (
                <YStack
                  key={option}
                  flex={1}
                  paddingVertical="$2"
                  borderRadius="$3"
                  alignItems="center"
                  backgroundColor={active ? "$chineseGold" : "transparent"}
                  pressStyle={{ scale: 0.97 }}
                  onPress={() => !isLoading && set("mode", option)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                >
                  <Text fontWeight="600" color={active ? "$pearlWhite" : "$textMuted"}>
                    {option === TRAINING_MODE.SINGLE ? t("trainingsModeSingle") : t("trainingsModeRecurring")}
                  </Text>
                </YStack>
              );
            })}
          </XStack>
        )}

        {mode === TRAINING_MODE.SINGLE && (
          <YStack gap="$3">
            <YStack gap="$1">
              <Text fontSize="$3" color="$textSecondary" fontWeight="500">
                {t("trainingsDatesLabel")}
              </Text>
              <Text fontSize="$2" color="$textMuted">
                {t("trainingsDatesHint")}
              </Text>
            </YStack>
            <MultiDateCalendar
              selected={dates}
              minDay={localToday()}
              maxDates={maxDates}
              onChange={(next) => set("dates", next)}
              error={translate(errors.dates?.message)}
              disabled={isLoading}
            />
            <XStack gap="$3">
              <TimeField
                label={t("trainingsStartTime")}
                value={startTime}
                onChange={(value) => set("startTime", value)}
                error={translate(errors.startTime?.message)}
                disabled={isLoading}
              />
              <TimeField
                label={t("trainingsEndTime")}
                value={endTime}
                onChange={(value) => set("endTime", value)}
                error={translate(errors.endTime?.message)}
                disabled={isLoading}
              />
            </XStack>
          </YStack>
        )}

        <TrainingAudienceFields
          visibility={visibility}
          schoolId={schoolId}
          inviteeIds={inviteeIds}
          onVisibilityChange={(value) => set("visibility", value)}
          onSchoolChange={(value) => set("schoolId", value)}
          onInviteesChange={(value) => set("inviteeIds", value)}
          schools={schools}
          members={members}
          errors={{
            visibility: translate(errors.visibility?.message),
            schoolId: translate(errors.schoolId?.message),
            inviteeIds: translate(errors.inviteeIds?.message),
          }}
          disabled={isLoading}
        />

        <TextInput
          control={control}
          name="location"
          label={t("fieldLocation")}
          placeholder={t("trainingsLocationPlaceholder")}
          error={translate(errors.location?.message)}
          disabled={isLoading}
          maxLength={300}
        />
      </YStack>
    );
  },
);

TrainingForm.displayName = "TrainingForm";
