import {
  AudienceChoice,
  CurrencySheet,
  DateTimeField,
  ListChip,
  PrimaryButton,
  SelectField,
  SubScreenPage,
  TextField,
  type AudienceMember,
} from "@/core/components";
import { formatDay } from "@/modules/trainings/components/format";
import { localToday } from "@/modules/trainings/types/helpers";
import React, { useState } from "react";
import { Text, XStack, YStack } from "tamagui";
import { useEventTypeName } from "../hooks/useEventTypes";
import { EVENT_CURRENCIES } from "../types/enums";
import type { CreateEventFormValues } from "../validation";
import {
  eventDayCount,
  hasEventChanges,
  validateEventForm,
  withStartDate,
  type EventFormErrors,
  type EventFormState,
} from "./eventFormState";
import { EventTypePickerSheet } from "./EventTypePickerSheet";

const NAME_MAX = 200;
const SHORT_NOTE_MAX = 300;
const ADDRESS_MAX = 500;

const formatShortDay = (day: string) => formatDay(day, { day: "numeric", month: "short", year: "numeric" });

interface EventFormScreenProps {
  title: string;
  initial: EventFormState;
  /** Edit: Save instead of Create, shown active only after a change. */
  editing?: boolean;
  schools: Array<{ id: string; name: string }>;
  members: AudienceMember[];
  /** Persists the validated values; a thrown error key is shown above the button. */
  onSubmit: (values: CreateEventFormValues) => Promise<void>;
  /** Opens the Event types screen from the type sheet's header icon. */
  onManageTypes?: () => void;
}

/**
 * New event (10A) and edit (10B): NAME, TYPE, SHORT NOTE, LOCATION, START / END
 * with the day count, PRICE / CURRENCY, "Who can see it?", Create / Save
 * pinned at the bottom in the Events amber.
 */
export const EventFormScreen: React.FC<EventFormScreenProps> = ({
  title,
  initial,
  editing,
  schools,
  members,
  onSubmit,
  onManageTypes,
}) => {
  const [form, setForm] = useState<EventFormState>(initial);
  const [errors, setErrors] = useState<EventFormErrors>({});
  const [submitError, setSubmitError] = useState<string | undefined>();
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const typeName = useEventTypeName(form.typeId);
  const [isSaving, setIsSaving] = useState(false);

  const today = localToday();
  // An edited event may already have started; its start stays pickable.
  const minStart = editing && initial.startDate < today ? initial.startDate : today;
  const changed = hasEventChanges(form, initial);
  const days = eventDayCount(form.startDate, form.endDate);

  /** Replaces the form and drops the errors of the fields that changed. */
  const apply = (next: EventFormState, clear: string[]) => {
    setForm(next);
    setErrors((e) => {
      const rest = { ...e };
      for (const key of clear) delete rest[key];
      return rest;
    });
    setSubmitError(undefined);
  };

  const update = (patch: Partial<EventFormState>, clear: string[] = Object.keys(patch)) =>
    apply({ ...form, ...patch }, clear);

  const handleSubmit = async () => {
    if (isSaving) return;
    const result = validateEventForm(form);
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
              accent="events"
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
            placeholder={t("eventsNamePlaceholder")}
            accent="events"
            maxLength={NAME_MAX}
            error={fieldError("name")}
            autoCapitalize="sentences"
          />
          <YStack gap={6}>
            <SelectField
              label={t("eventsTypeLabel")}
              value={form.typeId ? typeName : undefined}
              placeholder={t("chooseType")}
              onPress={() => setTypeOpen(true)}
              open={typeOpen}
              accent="events"
            />
            {fieldError("typeId") ? (
              <Text fontSize={12.5} fontWeight="$secondary" color="$trashText">
                {fieldError("typeId")}
              </Text>
            ) : null}
          </YStack>
          <TextField
            label={t("eventsShortNoteOptional")}
            value={form.shortNote}
            onChangeText={(shortNote) => update({ shortNote })}
            placeholder={t("eventsShortNotePlaceholder")}
            accent="events"
            maxLength={SHORT_NOTE_MAX}
            error={fieldError("shortNote")}
            autoCapitalize="sentences"
          />
          <TextField
            label={t("locationOptional")}
            value={form.address}
            onChangeText={(address) => update({ address })}
            placeholder={t("eventsAddressPlaceholder")}
            accent="events"
            maxLength={ADDRESS_MAX}
            error={fieldError("address")}
          />

          <YStack gap={12}>
            <XStack gap={12}>
              <DateTimeField
                mode="date"
                label={t("start")}
                value={form.startDate}
                format={formatShortDay}
                min={minStart}
                onChange={(startDate) => apply(withStartDate(form, startDate), ["startDate", "endDate"])}
                accent="events"
                error={fieldError("startDate")}
                disabled={isSaving}
              />
              <DateTimeField
                mode="date"
                label={t("end")}
                value={form.endDate}
                format={formatShortDay}
                min={form.startDate}
                onChange={(endDate) => update({ endDate })}
                accent="events"
                error={fieldError("endDate")}
                disabled={isSaving}
              />
            </XStack>
            <XStack alignItems="center" gap={8} flexWrap="wrap">
              {days !== null ? <ListChip accent="events" label={t("eventsDaysCount", { count: days })} /> : null}
              <Text fontSize={12.5} fontWeight="$secondary" color="$neutralMuted" flexShrink={1}>
                {editing ? t("eventsDatesEditHint") : t("eventsDatesHint")}
              </Text>
            </XStack>
          </YStack>

          <XStack gap={12} alignItems="flex-start">
            <YStack flex={5} minWidth={0}>
              <TextField
                label={t("fieldPrice")}
                value={form.price}
                onChangeText={(price) => update({ price })}
                placeholder="0"
                accent="events"
                keyboardType="decimal-pad"
                error={fieldError("price")}
              />
            </YStack>
            <YStack flex={2} minWidth={0}>
              <SelectField
                label={t("fieldCurrency")}
                value={form.currency}
                onPress={() => setCurrencyOpen(true)}
                open={currencyOpen}
                accent="events"
              />
            </YStack>
          </XStack>

          <AudienceChoice
            title={t("eventsAudienceTitle")}
            accent="events"
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

      <EventTypePickerSheet
        open={typeOpen}
        onOpenChange={setTypeOpen}
        selectedTypeId={form.typeId || undefined}
        onSelect={(typeId) => update({ typeId })}
        onManage={onManageTypes}
      />

      <CurrencySheet
        open={currencyOpen}
        onOpenChange={setCurrencyOpen}
        options={EVENT_CURRENCIES}
        value={form.currency}
        onSelect={(currency) => update({ currency })}
        accent="events"
      />
    </>
  );
};
