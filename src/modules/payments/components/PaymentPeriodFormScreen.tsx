import { ChoiceList, DateTimeField, PrimaryButton, SubScreenPage } from "@/core/components";
import React, { useMemo, useState } from "react";
import { Text, XStack, YStack } from "tamagui";
import { usePaymentCycles } from "../hooks/usePaymentCycles";
import {
  dateLocaleTag,
  formatPeriodDay,
  formatPeriodRange,
  localDayKey,
  periodPresetRange,
  type DayKey,
  type PeriodPreset,
} from "../paymentPeriod";

const PRESETS: { value: Exclude<PeriodPreset, "custom">; title: string }[] = [
  { value: "this_month", title: "paymentsThisMonth" },
  { value: "this_week", title: "paymentsThisWeek" },
  { value: "this_year", title: "paymentsThisYear" },
];

interface PaymentPeriodFormScreenProps {
  schoolId: string;
  /** After Create: the new period's details. */
  onCreated: (cycleId: string) => void;
}

/**
 * New period (14D / 14D1): This month / This week / This year with their
 * dates, or Custom with START / END; Create adds a payment for every active member.
 */
export const PaymentPeriodFormScreen: React.FC<PaymentPeriodFormScreenProps> = ({ schoolId, onCreated }) => {
  const { createCycle } = usePaymentCycles(schoolId);
  const locale = dateLocaleTag(t("locale"));
  const today = useMemo(() => localDayKey(new Date()), []);
  const [preset, setPreset] = useState<PeriodPreset>("this_month");
  const [custom, setCustom] = useState(() => periodPresetRange("this_month", today));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const range = preset === "custom" ? custom : periodPresetRange(preset, today);
  const invalid = range.end < range.start;

  const handleCreate = async () => {
    if (invalid) {
      setError(t("paymentsErrorEndBeforeStart"));
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const cycle = await createCycle({ periodStart: range.start, periodEnd: range.end });
      if (cycle) onCreated(cycle.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorCreateFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  const setCustomDay = (key: "start" | "end") => (day: DayKey) => {
    setError(null);
    setCustom((prev) => ({ ...prev, [key]: day }));
  };

  return (
    <SubScreenPage
      title={t("paymentsNewPeriod")}
      context="school"
      footer={
        <YStack gap={10}>
          {error ? (
            <Text fontSize={12.5} fontWeight="$secondary" color="$trashText" textAlign="center">
              {error}
            </Text>
          ) : null}
          <PrimaryButton label={t("create")} accent="payments" onPress={handleCreate} loading={isSaving} />
        </YStack>
      }
    >
      <YStack gap={18}>
        <ChoiceList
          title={t("paymentsPeriod")}
          accent="payments"
          value={preset}
          onChange={(value) => {
            setError(null);
            setPreset(value);
          }}
          options={[
            ...PRESETS.map((p) => {
              const r = periodPresetRange(p.value, today);
              return { value: p.value as PeriodPreset, title: t(p.title), hint: formatPeriodRange(r.start, r.end, locale) };
            }),
            { value: "custom" as PeriodPreset, title: t("paymentsCustom"), hint: t("paymentsCustomHint") },
          ]}
        />
        {preset === "custom" ? (
          <XStack gap={12}>
            <YStack flex={1} minWidth={0}>
              <DateTimeField
                label={t("paymentsStart")}
                mode="date"
                value={custom.start}
                onChange={setCustomDay("start")}
                format={(day) => formatPeriodDay(day, locale)}
                accent="payments"
              />
            </YStack>
            <YStack flex={1} minWidth={0}>
              <DateTimeField
                label={t("paymentsEnd")}
                mode="date"
                value={custom.end}
                onChange={setCustomDay("end")}
                format={(day) => formatPeriodDay(day, locale)}
                min={custom.start}
                accent="payments"
                error={invalid ? t("paymentsErrorEndBeforeStart") : undefined}
              />
            </YStack>
          </XStack>
        ) : null}
      </YStack>
    </SubScreenPage>
  );
};
