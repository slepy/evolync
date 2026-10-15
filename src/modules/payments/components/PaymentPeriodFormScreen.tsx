import {
  ChoiceList,
  CurrencySheet,
  DateTimeField,
  FormCard,
  PrimaryButton,
  SelectField,
  SubScreenPage,
  TextField,
  ToggleRow,
} from "@/core/components";
import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from "@/modules/core/components";
import { SchoolSettingsRepository } from "@/modules/school/repositories";
import { CreditCard } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { Text, XStack, YStack } from "tamagui";
import { usePaymentCycles } from "../hooks/usePaymentCycles";
import {
  dateLocaleTag,
  formatAmount,
  formatPeriodDay,
  formatPeriodRange,
  localDayKey,
  parseAmount,
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
 * dates, or Custom with START / END; Create adds a payment for every active
 * member. Amount card: "Use default amounts" (each student's own amount or the
 * school default) or, switched off, one AMOUNT + CURRENCY for everyone in this period.
 */
export const PaymentPeriodFormScreen: React.FC<PaymentPeriodFormScreenProps> = ({ schoolId, onCreated }) => {
  const { createCycle } = usePaymentCycles(schoolId);
  const locale = dateLocaleTag(t("locale"));
  const today = useMemo(() => localDayKey(new Date()), []);
  const [preset, setPreset] = useState<PeriodPreset>("this_month");
  const [custom, setCustom] = useState(() => periodPresetRange("this_month", today));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useDefaults, setUseDefaults] = useState(true);
  const [schoolDefault, setSchoolDefault] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<string>(DEFAULT_CURRENCY);
  const [currencyOpen, setCurrencyOpen] = useState(false);

  useEffect(() => {
    const subscription = SchoolSettingsRepository.observeBySchoolId(schoolId).subscribe({
      next: ([settings]) => {
        if (!settings) return;
        setSchoolDefault(`${formatAmount(settings.defaultPaymentAmount ?? 0)} ${settings.defaultCurrency}`);
        setAmount((prev) => prev || formatAmount(settings.defaultPaymentAmount ?? 0));
        setCurrency(settings.defaultCurrency || DEFAULT_CURRENCY);
      },
      error: (err: Error) => console.error("[PaymentPeriodForm] Settings error:", err),
    });
    return () => subscription.unsubscribe();
  }, [schoolId]);

  const range = preset === "custom" ? custom : periodPresetRange(preset, today);
  const invalid = range.end < range.start;
  const parsedAmount = parseAmount(amount);
  const amountInvalid = !useDefaults && parsedAmount === null;

  const handleCreate = async () => {
    if (invalid) {
      setError(t("paymentsErrorEndBeforeStart"));
      return;
    }
    if (amountInvalid) return;
    setIsSaving(true);
    setError(null);
    try {
      const cycle = await createCycle({
        periodStart: range.start,
        periodEnd: range.end,
        ...(useDefaults ? {} : { amount: parsedAmount!, currency }),
      });
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

        <FormCard
          icon={CreditCard}
          accent="payments"
          title={t("fieldAmount")}
          subtitle={useDefaults ? t("paymentsDefaultAmountsHint") : t("paymentsPeriodAmountHint")}
        >
          <ToggleRow
            title={t("paymentsUseDefaultAmounts")}
            hint={schoolDefault ? t("paymentsSchoolDefault", { amount: schoolDefault }) : undefined}
            label={t("paymentsUseDefaultAmounts")}
            checked={useDefaults}
            onChange={(checked) => {
              setError(null);
              setUseDefaults(checked);
            }}
            accent="payments"
          />
          {useDefaults ? null : (
            <XStack gap={12}>
              <YStack flex={5} minWidth={0}>
                <TextField
                  label={t("fieldAmount")}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  accent="payments"
                  inset
                  error={amountInvalid ? t("amountInvalidType") : undefined}
                />
              </YStack>
              <YStack flex={3} minWidth={0}>
                <SelectField
                  label={t("fieldCurrency")}
                  value={currency}
                  onPress={() => setCurrencyOpen(true)}
                  open={currencyOpen}
                  accent="payments"
                  inset
                />
              </YStack>
            </XStack>
          )}
        </FormCard>
      </YStack>

      <CurrencySheet
        open={currencyOpen}
        onOpenChange={setCurrencyOpen}
        options={SUPPORTED_CURRENCIES}
        value={currency}
        accent="payments"
        onSelect={setCurrency}
      />
    </SubScreenPage>
  );
};
