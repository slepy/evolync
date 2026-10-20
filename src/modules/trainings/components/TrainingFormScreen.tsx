import {
  AudienceChoice,
  DateTimeField,
  ListChip,
  type AudienceMember,
  PillGroup,
  PrimaryButton,
  SubScreenPage,
  TextField,
  withAlpha,
} from "@/core/components";
import { moduleAccents } from "@/core/theme/tokens";
import { Plus } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { Text, XStack, YStack } from "tamagui";
import type { SchoolAddressOption } from "../hooks/useSchoolsWithAddress";
import type { SeriesRule } from "../types/dto";
import { TRAINING_LOCATION_MAX, TRAINING_MODE, TRAINING_NAME_MAX, type TrainingMode } from "../types/enums";
import { localToday, maxSeriesEnd } from "../types/helpers";
import type { TrainingFormValues } from "../validation";
import { formatDay } from "./format";
import { SchoolAddressSheet } from "./SchoolAddressSheet";
import { SeriesRuleCard } from "./SeriesRuleCard";
import {
  countOccurrences,
  hasTrainingChanges,
  nextRule,
  validateTrainingForm,
  type TrainingFormErrors,
  type TrainingFormState,
} from "./trainingFormState";

const formatFullDay = (day: string) =>
  formatDay(day, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
const formatShortDay = (day: string) => formatDay(day, { day: "numeric", month: "short", year: "numeric" });

const ACCENT = moduleAccents.trainings;

interface TrainingFormScreenProps {
  title: string;
  initial: TrainingFormState;
  /** Modes the user may pick; one mode hides the Repeats switch (edits). */
  modes: TrainingMode[];
  /** Edit: Save instead of Create, shown active only after a change. */
  editing?: boolean;
  /** "This and following": the new series starts on this day at the earliest. */
  minStartDate?: string;
  schools: Array<{ id: string; name: string }>;
  members: AudienceMember[];
  /** Schools offered by "Use school address". */
  schoolAddresses: SchoolAddressOption[];
  /** Persists the validated values; a thrown error key is shown above the button. */
  onSubmit: (values: TrainingFormValues) => Promise<void>;
}

/**
 * New training (11A single, 11B recurring) and edit (11C this and
 * following, or this training only): NAME, REPEATS, the day or the
 * REPEAT ON days with FROM / UNTIL, LOCATION, "Who is it for?", Create /
 * Save pinned at the bottom in the Trainings teal.
 */
export const TrainingFormScreen: React.FC<TrainingFormScreenProps> = ({
  title,
  initial,
  modes,
  editing,
  minStartDate,
  schools,
  members,
  schoolAddresses,
  onSubmit,
}) => {
  const [form, setForm] = useState<TrainingFormState>(initial);
  const [errors, setErrors] = useState<TrainingFormErrors>({});
  const [submitError, setSubmitError] = useState<string | undefined>();
  const [addressSheetOpen, setAddressSheetOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const today = localToday();
  const minDay = minStartDate && minStartDate > today ? minStartDate : today;
  const changed = hasTrainingChanges(form, initial);
  const occurrences = useMemo(() => countOccurrences(form), [form]);
  const pickableAddresses = schoolAddresses.filter((s) => s.address);

  /** Updates fields and drops the errors of the fields that changed. */
  const update = (patch: Partial<TrainingFormState>, clear: string[] = Object.keys(patch)) => {
    setForm((f) => ({ ...f, ...patch }));
    setErrors((e) => {
      const next = { ...e };
      for (const key of Object.keys(next)) {
        if (clear.some((c) => key === c || key.startsWith(`${c}.`))) delete next[key];
      }
      return next;
    });
    setSubmitError(undefined);
  };

  const updateRule = (index: number, rule: SeriesRule) =>
    update({ rules: form.rules.map((r, i) => (i === index ? rule : r)) }, [`rules.${index}`, "rules"]);

  const handleUseSchoolAddress = () => {
    if (pickableAddresses.length === 1) update({ location: pickableAddresses[0].address ?? "" });
    else setAddressSheetOpen(true);
  };

  const handleSubmit = async () => {
    if (isSaving) return;
    const result = validateTrainingForm(form);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setIsSaving(true);
    setSubmitError(undefined);
    try {
      await onSubmit(result.values);
    } catch (err) {
      setSubmitError(t(err instanceof Error ? err.message : "errorUnknown"));
    } finally {
      setIsSaving(false);
    }
  };

  const fieldError = (path: string) => (errors[path] ? t(errors[path]) : undefined);
  const recurring = form.mode === TRAINING_MODE.RECURRING;

  return (
    <>
      <SubScreenPage
        title={title}
        footer={
          <YStack gap={10}>
            {submitError ? (
              <Text fontSize={12.5} fontWeight="$secondary" color="$trashText" textAlign="center">
                {submitError}
              </Text>
            ) : null}
            <PrimaryButton
              label={editing ? t("save") : t("create")}
              accent="trainings"
              onPress={handleSubmit}
              disabled={editing && !changed}
              loading={isSaving}
            />
          </YStack>
        }
      >
        <YStack gap={18}>
          <TextField
            label={t("fieldName")}
            value={form.name}
            onChangeText={(name) => update({ name })}
            placeholder={t("trainingsNamePlaceholder")}
            accent="trainings"
            maxLength={TRAINING_NAME_MAX}
            error={fieldError("name")}
            autoCapitalize="sentences"
          />

          {modes.length > 1 ? (
            <PillGroup
              label={t("trainingsRepeatsLabel")}
              options={modes.map((mode) => ({
                value: mode,
                label: mode === TRAINING_MODE.SINGLE ? t("trainingsModeSingle") : t("trainingsModeRecurring"),
              }))}
              value={form.mode}
              onChange={(mode) => update({ mode }, [])}
              accent="trainings"
              disabled={isSaving}
            />
          ) : null}

          {recurring ? (
            <YStack gap={10}>
              <Text fontSize={12} fontWeight="$eyebrow" letterSpacing={0.8} textTransform="uppercase" color="$neutralMuted">
                {t("trainingsRulesLabel")}
              </Text>
              {form.rules.map((rule, index) => (
                <SeriesRuleCard
                  key={index}
                  rule={rule}
                  onChange={(next) => updateRule(index, next)}
                  onRemove={
                    form.rules.length > 1
                      ? () => update({ rules: form.rules.filter((_, i) => i !== index) }, ["rules"])
                      : undefined
                  }
                  errors={{
                    weekOfMonth: fieldError(`rules.${index}.weekOfMonth`),
                    startTime: fieldError(`rules.${index}.startTime`),
                    endTime: fieldError(`rules.${index}.endTime`),
                  }}
                  disabled={isSaving}
                />
              ))}
              {fieldError("rules") ? (
                <Text fontSize={12.5} fontWeight="$secondary" color="$trashText">
                  {fieldError("rules")}
                </Text>
              ) : null}
              <XStack
                role="button"
                aria-label={t("trainingsAddAnotherDay")}
                onPress={isSaving ? undefined : () => update({ rules: [...form.rules, nextRule(form.rules)] }, ["rules"])}
                pressStyle={{ opacity: 0.8 }}
                height={44}
                borderRadius={22}
                borderWidth={1}
                borderStyle="dashed"
                borderColor={withAlpha(ACCENT.tint, 0.5)}
                alignItems="center"
                justifyContent="center"
                gap={6}
              >
                <Plus size={16} color={ACCENT.tint} strokeWidth={2.8} />
                <Text fontSize={14} fontWeight="$button" color="$trainingsTint">
                  {t("trainingsAddAnotherDay")}
                </Text>
              </XStack>
            </YStack>
          ) : (
            <XStack>
              <DateTimeField
                mode="date"
                label={t("fieldDate")}
                value={form.date}
                format={formatFullDay}
                min={today}
                onChange={(date) => update({ date })}
                accent="trainings"
                hint={editing ? undefined : t("trainingsDateHint")}
                error={fieldError("date")}
                disabled={isSaving}
              />
            </XStack>
          )}

          {recurring ? (
            <YStack gap={12}>
              <XStack gap={12}>
                <DateTimeField
                  mode="date"
                  label={t("from")}
                  value={form.startDate}
                  format={formatShortDay}
                  min={minDay}
                  onChange={(startDate) =>
                    update(
                      {
                        startDate,
                        endDate:
                          form.endDate < startDate
                            ? startDate
                            : form.endDate > maxSeriesEnd(startDate)
                              ? maxSeriesEnd(startDate)
                              : form.endDate,
                      },
                      ["startDate", "endDate"],
                    )
                  }
                  accent="trainings"
                  error={fieldError("startDate")}
                  disabled={isSaving}
                />
                <DateTimeField
                  mode="date"
                  label={t("trainingsUntil")}
                  value={form.endDate}
                  format={formatShortDay}
                  min={form.startDate}
                  max={maxSeriesEnd(form.startDate)}
                  onChange={(endDate) => update({ endDate })}
                  accent="trainings"
                  error={fieldError("endDate")}
                  disabled={isSaving}
                />
              </XStack>
              <XStack alignItems="center" gap={8} flexWrap="wrap">
                {occurrences !== null ? (
                  <ListChip
                    accent="trainings"
                    label={t(editing ? "trainingsReplacesCount" : "trainingsCreatesCount", { count: occurrences })}
                  />
                ) : null}
                <Text fontSize={12.5} fontWeight="$secondary" color="$neutralMuted" flexShrink={1}>
                  {editing ? t("trainingsEarlierStayHint") : t("trainingsSeriesLimitHint")}
                </Text>
              </XStack>
            </YStack>
          ) : (
            <XStack gap={12}>
              <DateTimeField
                mode="time"
                label={t("start")}
                value={form.startTime}
                onChange={(startTime) => update({ startTime })}
                accent="trainings"
                error={fieldError("startTime")}
                disabled={isSaving}
              />
              <DateTimeField
                mode="time"
                label={t("end")}
                value={form.endTime}
                onChange={(endTime) => update({ endTime })}
                accent="trainings"
                error={fieldError("endTime")}
                disabled={isSaving}
              />
            </XStack>
          )}

          <YStack gap={8}>
            <TextField
              label={t("locationOptional")}
              value={form.location}
              onChangeText={(location) => update({ location })}
              placeholder={t("trainingsLocationPlaceholder")}
              accent="trainings"
              maxLength={TRAINING_LOCATION_MAX}
              error={fieldError("location")}
            />
            {pickableAddresses.length > 0 ? (
              <XStack
                role="button"
                aria-label={t("trainingsUseSchoolAddress")}
                onPress={isSaving ? undefined : handleUseSchoolAddress}
                pressStyle={{ opacity: 0.8 }}
                alignSelf="flex-start"
                height={36}
                paddingHorizontal={14}
                borderRadius={18}
                backgroundColor="$trainingsFill"
                alignItems="center"
              >
                <Text fontSize={13} fontWeight="$button" color="$trainingsTint">
                  {t("trainingsUseSchoolAddress")}
                </Text>
              </XStack>
            ) : null}
          </YStack>

          <AudienceChoice
            title={t("trainingsAudienceTitle")}
            accent="trainings"
            visibility={form.visibility}
            schoolId={form.schoolId}
            inviteeIds={form.inviteeIds}
            onVisibilityChange={(visibility) => update({ visibility }, ["visibility", "schoolId", "inviteeIds"])}
            onSchoolChange={(schoolId) => update({ schoolId })}
            onInviteesChange={(inviteeIds) => update({ inviteeIds })}
            schools={schools}
            members={members}
            errors={{
              visibility: fieldError("visibility"),
              schoolId: fieldError("schoolId"),
              inviteeIds: fieldError("inviteeIds"),
            }}
            disabled={isSaving}
          />
        </YStack>
      </SubScreenPage>

      <SchoolAddressSheet
        open={addressSheetOpen}
        onOpenChange={setAddressSheetOpen}
        schools={schoolAddresses}
        onPick={(location) => update({ location })}
      />
    </>
  );
};
