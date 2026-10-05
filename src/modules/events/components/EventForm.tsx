import {
  CurrencySelect,
  DatePickerInput,
  DEFAULT_CURRENCY,
  ErrorBanner,
  NumberInput,
  TextInput,
} from "@/modules/core/components";
import { EVENT_VISIBILITY } from "@/database/models/Event";
import { SelectableMemberCard } from "@/modules/students/components";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown } from "lucide-react-native";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Adapt, Select, Sheet, Text, XStack, YStack } from "tamagui";

import type Event from "@/database/models/Event";
import type { CreateEventFormValues } from "../validation";
import { createEventSchema } from "../validation";

// ============================================================================
// Constants
// ============================================================================

const VISIBILITY_OPTIONS = [
  {
    value: EVENT_VISIBILITY.ORGANIZATION,
    label: "eventsVisibilityOrganization",
  },
  { value: EVENT_VISIBILITY.SCHOOL, label: "eventsVisibilitySchool" },
  { value: EVENT_VISIBILITY.WHITELIST, label: "eventsVisibilityWhitelist" },
] as const;

// ============================================================================
// Types
// ============================================================================

export interface EventFormHandle {
  submit: () => void;
  isDirty: boolean;
}

interface EventFormProps {
  initialData?: Event;
  initialParticipantIds?: string[];
  /** New event: "YYYY-MM-DD" filled in as start and end date (day picked in the calendar). */
  initialStartDate?: string;
  schools?: Array<{ id: string; name: string }>;
  members?: Array<{ id: string; displayName: string; schoolName?: string }>;
  onSubmit: (data: CreateEventFormValues) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  onResetError: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}

// ============================================================================
// EventForm Component
// ============================================================================

export const EventForm = forwardRef<EventFormHandle, EventFormProps>(
  (
    {
      initialData,
      initialParticipantIds = [],
      initialStartDate,
      schools = [],
      members = [],
      onSubmit,
      isLoading,
      error,
      onResetError,
      onDirtyChange,
    },
    ref,
  ) => {
    const isEditMode = !!initialData;
    const today = new Date();
    const hasInitialized = useRef(false);

    const {
      control,
      handleSubmit,
      setValue,
      formState: { errors, isDirty },
    } = useForm<CreateEventFormValues>({
      resolver: zodResolver(createEventSchema),
      defaultValues: initialData
        ? {
            name: initialData.name,
            shortNote: initialData.shortNote || undefined,
            address: initialData.address || undefined,
            startDate: initialData.startDate.toISOString().split("T")[0],
            endDate: initialData.endDate.toISOString().split("T")[0],
            price: initialData.price,
            currency: initialData.currency,
            visibility: initialData.visibility,
            schoolId: initialData.schoolId || undefined,
            whitelistedMemberIds: initialParticipantIds,
          }
        : {
            name: "",
            shortNote: undefined,
            address: undefined,
            startDate: initialStartDate ?? today.toISOString().split("T")[0],
            endDate: initialStartDate ?? today.toISOString().split("T")[0],
            price: 0,
            currency: DEFAULT_CURRENCY,
            visibility: EVENT_VISIBILITY.ORGANIZATION,
            schoolId: undefined,
            whitelistedMemberIds: [],
          },
    });

    const visibility = useWatch({ control, name: "visibility" });
    const startDateStr = useWatch({ control, name: "startDate" });
    const endDateStr = useWatch({ control, name: "endDate" });

    const startDate = startDateStr ? new Date(startDateStr) : today;
    const endDate = endDateStr ? new Date(endDateStr) : today;

    // Update whitelistedMemberIds ONLY on initial load (async load from DB)
    useEffect(() => {
      if (
        isEditMode &&
        initialParticipantIds.length > 0 &&
        !hasInitialized.current
      ) {
        setValue("whitelistedMemberIds", initialParticipantIds, {
          shouldDirty: false,
        });
        hasInitialized.current = true;
      }
    }, [initialParticipantIds, isEditMode, setValue]);

    useImperativeHandle(ref, () => ({
      submit: handleSubmit(onSubmit),
      isDirty,
    }));

    useEffect(() => {
      onDirtyChange?.(isDirty);
    }, [isDirty, onDirtyChange]);

    const handleStartDateChange = (date: Date) => {
      setValue("startDate", date.toISOString().split("T")[0]);
      // If end date is before start date, update end date
      if (date > endDate) {
        setValue("endDate", date.toISOString().split("T")[0]);
      }
    };

    const handleEndDateChange = (date: Date) => {
      setValue("endDate", date.toISOString().split("T")[0]);
    };

    return (
      <YStack gap="$4" width="100%">
        {/* Error Banner */}
        {error && (
          <ErrorBanner
            title={isEditMode ? t("errorUpdateFailed") : t("errorCreateFailed")}
            message={error}
            onDismiss={onResetError}
          />
        )}

        {/* Event Name */}
        <TextInput
          control={control}
          name="name"
          label={t("eventsNameLabel")}
          placeholder={t("eventsNamePlaceholder")}
          error={errors.name?.message ? t(errors.name.message) : undefined}
          disabled={isLoading}
          autoCapitalize="words"
        />

        {/* Short Note */}
        <TextInput
          control={control}
          name="shortNote"
          label={t("eventsShortNoteLabel")}
          placeholder={t("eventsShortNotePlaceholder")}
          error={
            errors.shortNote?.message ? t(errors.shortNote.message) : undefined
          }
          disabled={isLoading}
          autoCapitalize="sentences"
        />

        {/* Address */}
        <TextInput
          control={control}
          name="address"
          label={t("fieldLocation")}
          placeholder={t("eventsAddressPlaceholder")}
          error={
            errors.address?.message ? t(errors.address.message) : undefined
          }
          disabled={isLoading}
        />

        {/* Date Section */}
        <YStack gap="$3">
          <DatePickerInput
            label={t("fieldStartDate")}
            value={startDate}
            onChange={handleStartDateChange}
            error={
              errors.startDate?.message
                ? t(errors.startDate.message)
                : undefined
            }
            disabled={isLoading}
          />

          <DatePickerInput
            label={t("fieldEndDate")}
            value={endDate}
            onChange={handleEndDateChange}
            minimumDate={startDate}
            error={
              errors.endDate?.message ? t(errors.endDate.message) : undefined
            }
            disabled={isLoading}
          />
        </YStack>

        {/* Price and Currency */}
        <YStack gap="$3">
          <XStack gap="$3">
            <NumberInput
              control={control}
              name="price"
              label={t("fieldAmount")}
              placeholder="0.00"
              error={
                errors.price?.message ? t(errors.price.message) : undefined
              }
              disabled={isLoading}
              flex={2}
            />
            <CurrencySelect
              control={control}
              name="currency"
              label={t("fieldCurrency")}
              error={
                errors.currency?.message
                  ? t(errors.currency.message)
                  : undefined
              }
              disabled={isLoading}
              flex={1}
            />
          </XStack>
        </YStack>

        {/* Visibility */}
        <YStack gap="$3">
          <YStack gap="$2">
            <Text fontSize="$3" color="$textSecondary" fontWeight="500">
              {t("eventsVisibilityLabel")}
            </Text>
            <Controller
              control={control}
              name="visibility"
              render={({ field: { onChange, value } }) => (
                <Select
                  value={value}
                  onValueChange={onChange as (value: string) => void}
                  disablePreventBodyScroll
                >
                  <Select.Trigger
                    borderColor={
                      errors.visibility ? "$imperialRed" : "$borderStrong"
                    }
                    borderWidth={2}
                    backgroundColor={
                      isLoading ? "$fillStrong" : "$background"
                    }
                    disabled={isLoading}
                    iconAfter={ChevronDown}
                  >
                    <Select.Value
                      placeholder={t("eventsVisibilityOrganization")}
                    />
                  </Select.Trigger>

                  <Adapt when="sm" platform="touch">
                    <Sheet modal dismissOnSnapToBottom snapPointsMode="fit">
                      <Sheet.Frame>
                        <Sheet.ScrollView>
                          <Adapt.Contents />
                        </Sheet.ScrollView>
                      </Sheet.Frame>
                      <Sheet.Overlay />
                    </Sheet>
                  </Adapt>

                  <Select.Content zIndex={200000}>
                    <Select.ScrollUpButton />
                    <Select.Viewport>
                      {VISIBILITY_OPTIONS.map((option, index) => (
                        <Select.Item
                          key={option.value}
                          value={option.value}
                          index={index}
                        >
                          <Select.ItemText>{t(option.label)}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                    <Select.ScrollDownButton />
                  </Select.Content>
                </Select>
              )}
            />
            {errors.visibility?.message && (
              <Text color="$imperialRed" fontSize="$3">
                {t(errors.visibility.message)}
              </Text>
            )}
          </YStack>

          {/* School Selector (shown when visibility = school) */}
          {visibility === EVENT_VISIBILITY.SCHOOL && schools.length > 0 && (
            <YStack gap="$2">
              <Text fontSize="$3" color="$textSecondary" fontWeight="500">
                {t("eventsSchoolLabel")}
              </Text>
              <Controller
                control={control}
                name="schoolId"
                render={({ field: { onChange, value } }) => (
                  <Select
                    value={value || ""}
                    onValueChange={onChange}
                    disablePreventBodyScroll
                  >
                    <Select.Trigger
                      borderColor={
                        errors.schoolId ? "$imperialRed" : "$borderStrong"
                      }
                      borderWidth={2}
                      backgroundColor={
                        isLoading ? "$fillStrong" : "$background"
                      }
                      disabled={isLoading}
                      iconAfter={ChevronDown}
                    >
                      <Select.Value
                        placeholder={t("eventsSchoolPlaceholder")}
                      />
                    </Select.Trigger>

                    <Adapt when="sm" platform="touch">
                      <Sheet modal dismissOnSnapToBottom snapPointsMode="fit">
                        <Sheet.Frame>
                          <Sheet.ScrollView>
                            <Adapt.Contents />
                          </Sheet.ScrollView>
                        </Sheet.Frame>
                        <Sheet.Overlay />
                      </Sheet>
                    </Adapt>

                    <Select.Content zIndex={200000}>
                      <Select.ScrollUpButton />
                      <Select.Viewport>
                        {schools.map((school, index) => (
                          <Select.Item
                            key={school.id}
                            value={school.id}
                            index={index}
                          >
                            <Select.ItemText>{school.name}</Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                      <Select.ScrollDownButton />
                    </Select.Content>
                  </Select>
                )}
              />
              {errors.schoolId?.message && (
                <Text color="$imperialRed" fontSize="$3">
                  {t(errors.schoolId.message)}
                </Text>
              )}
            </YStack>
          )}

          {/* Member Whitelist Selector (shown when visibility = whitelist) */}
          {visibility === EVENT_VISIBILITY.WHITELIST && (
            <YStack gap="$2">
              <Text fontSize="$3" color="$textSecondary" fontWeight="500">
                {t("eventsWhitelistLabel")}
              </Text>
              <Controller
                control={control}
                name="whitelistedMemberIds"
                render={({ field: { onChange, value = [] } }) => (
                  <YStack>
                    {members.length === 0 ? (
                      <Text color="$gray10" fontSize="$3">
                        {t("emptyNoMembersAvailable")}
                      </Text>
                    ) : (
                      members.map((member) => {
                        const isChecked = value.includes(member.id);
                        return (
                          <SelectableMemberCard
                            key={member.id}
                            member={member}
                            isSelected={isChecked}
                            onPress={() => {
                              if (isLoading) return;
                              const newValue = isChecked
                                ? value.filter((id) => id !== member.id)
                                : [...value, member.id];
                              onChange(newValue);
                            }}
                            disabled={isLoading}
                          />
                        );
                      })
                    )}
                  </YStack>
                )}
              />
              {errors.whitelistedMemberIds?.message && (
                <Text color="$imperialRed" fontSize="$3">
                  {t(errors.whitelistedMemberIds.message)}
                </Text>
              )}
            </YStack>
          )}
        </YStack>
      </YStack>
    );
  },
);
