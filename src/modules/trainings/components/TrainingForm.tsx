import { ErrorBanner, TextInput } from "@/modules/core/components";
import { TRAINING_VISIBILITY, type TrainingVisibility } from "@/database/models/Training";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin } from "lucide-react-native";
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { Button, Text, XStack, YStack, useTheme } from "tamagui";

import type { SeriesRule } from "../types/dto";
import { TRAINING_MODE, type TrainingMode } from "../types/enums";
import {
  addMonths,
  expandSeriesRules,
  isTimeRangeValid,
  isValidDay,
  localToday,
  maxSeriesEnd,
} from "../types/helpers";
import type { SchoolAddressOption } from "../hooks/useSchoolsWithAddress";
import { trainingSchema, type TrainingFormValues } from "../validation";
import { DayField } from "./DayField";
import { MultiDateCalendar } from "./MultiDateCalendar";
import { SchoolAddressSheet } from "./SchoolAddressSheet";
import { SeriesRulesEditor, newRule, type RuleErrors } from "./SeriesRulesEditor";
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
  /** Schools offered by "Use school address". */
  schoolAddresses?: SchoolAddressOption[];
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
    endDate: addMonths(today, 3),
    rules: [newRule()],
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
      schoolAddresses = [],
      onSubmit,
      isLoading,
      error,
      onResetError,
      onDirtyChange,
    },
    ref,
  ) => {
    const theme = useTheme();
    const [addressSheetOpen, setAddressSheetOpen] = useState(false);
    const {
      control,
      handleSubmit,
      setValue,
      formState: { errors, isDirty, isSubmitted },
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
    const startDate = useWatch({ control, name: "startDate" });
    const endDate = useWatch({ control, name: "endDate" });
    const rules = useWatch({ control, name: "rules" });

    /** Live count of trainings the series would create (only for a valid draft). */
    const occurrenceCount = useMemo(() => {
      if (!isValidDay(startDate) || !isValidDay(endDate) || endDate < startDate) return null;
      if (endDate > maxSeriesEnd(startDate)) return null;
      if (rules.some((r) => !isTimeRangeValid(r.startTime, r.endTime))) return null;
      return expandSeriesRules(rules, startDate, endDate).length;
    }, [rules, startDate, endDate]);

    // After a failed submit, re-validate on change so fixed fields clear their errors.
    const set = <K extends keyof TrainingFormState>(key: K, value: TrainingFormState[K]) =>
      setValue(key, value as never, { shouldDirty: true, shouldValidate: isSubmitted });

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

        {mode === TRAINING_MODE.RECURRING && (
          <YStack gap="$3">
            <SeriesRulesEditor
              rules={rules}
              onChange={(next) => set("rules", next)}
              errors={(errors.rules as unknown as (RuleErrors | undefined)[] | undefined)?.map((e) =>
                e
                  ? {
                      weekOfMonth: translate((e.weekOfMonth as { message?: string } | undefined)?.message),
                      startTime: translate((e.startTime as { message?: string } | undefined)?.message),
                      endTime: translate((e.endTime as { message?: string } | undefined)?.message),
                    }
                  : undefined,
              )}
              error={translate(errors.rules?.message ?? errors.rules?.root?.message)}
              disabled={isLoading}
            />
            <XStack gap="$3">
              <DayField
                label={t("trainingsFrom")}
                value={startDate}
                min={localToday()}
                onChange={(day) => {
                  set("startDate", day);
                  if (endDate < day) set("endDate", day);
                }}
                error={translate(errors.startDate?.message)}
                disabled={isLoading}
              />
              <DayField
                label={t("trainingsUntil")}
                value={endDate}
                min={startDate}
                max={maxSeriesEnd(startDate)}
                onChange={(day) => set("endDate", day)}
                error={translate(errors.endDate?.message)}
                disabled={isLoading}
              />
            </XStack>
            <Text fontSize="$2" color="$textMuted">
              {t("trainingsUntilHint")}
            </Text>
            {occurrenceCount !== null && (
              <Text fontSize="$3" color="$textSecondary" fontWeight="600">
                {t("trainingsOccurrencesCount", { count: occurrenceCount })}
              </Text>
            )}
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
        {schoolAddresses.length > 0 && (
          <Button
            size="$3"
            alignSelf="flex-start"
            chromeless
            disabled={isLoading}
            icon={<MapPin size={16} color={theme.chineseGold?.val} />}
            onPress={() => setAddressSheetOpen(true)}
          >
            <Text color="$chineseGold" fontWeight="600">
              {t("trainingsUseSchoolAddress")}
            </Text>
          </Button>
        )}

        <SchoolAddressSheet
          open={addressSheetOpen}
          onOpenChange={setAddressSheetOpen}
          schools={schoolAddresses}
          onPick={(address) => set("location", address)}
        />
      </YStack>
    );
  },
);

TrainingForm.displayName = "TrainingForm";
