import {
  CurrencySheet,
  FormCard,
  PrimaryButton,
  SelectField,
  SubScreenPage,
  TextField,
} from "@/core/components";
import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from "@/core/utils/currencies";
import { useDirtyFlag } from "@/core/hooks";
import { Building2, CreditCard, MapPin } from "lucide-react-native";
import React, { useState } from "react";
import { Text, XStack, YStack } from "tamagui";
import type { CombinedSchoolSettingsFormValues } from "../validation";
import { schoolSettingsFormSchema } from "../validation";
import type { SchoolSettingsValues } from "../types";

interface SchoolSettingsScreenProps {
  initial: SchoolSettingsValues;
  /** Persists the validated values; a thrown error is shown above the button. */
  onSubmit: (data: CombinedSchoolSettingsFormValues) => Promise<void>;
}

type Field = "name" | "address" | "defaultCurrency" | "defaultPaymentAmount";

/** Zod messages of the payment fields are translation keys; the name / address ones come translated. */
const errorText = (message: string) => (message.startsWith("settings.") ? t(message) : message);

/**
 * School settings (15A / 15B, owner only): Basic info (SCHOOL NAME, ADDRESS)
 * and Payment defaults (DEFAULT AMOUNT + CURRENCY) cards, a note under them;
 * Save in the school red appears after the first change.
 */
export const SchoolSettingsScreen: React.FC<SchoolSettingsScreenProps> = ({ initial, onSubmit }) => {
  const [name, setName] = useState(initial.name);
  const [address, setAddress] = useState(initial.address ?? "");
  const [currency, setCurrency] = useState(initial.defaultCurrency ?? DEFAULT_CURRENCY);
  const [amount, setAmount] = useState(String(initial.defaultPaymentAmount ?? 0));
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [submitError, setSubmitError] = useState<string | undefined>();
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { isDirty, markDirty } = useDirtyFlag();

  const change = (field: Field, set: (value: string) => void) => (value: string) => {
    set(value);
    markDirty();
    setErrors((e) => ({ ...e, [field]: undefined }));
    setSubmitError(undefined);
  };

  const handleSave = async () => {
    if (isSaving) return;
    const result = schoolSettingsFormSchema.safeParse({
      name,
      address,
      defaultCurrency: currency,
      defaultPaymentAmount: amount,
    });
    if (!result.success) {
      const next: Partial<Record<Field, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as Field;
        next[field] ??= errorText(issue.message);
      }
      setErrors(next);
      return;
    }
    setIsSaving(true);
    try {
      await onSubmit(result.data);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t("errorSaveFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <SubScreenPage
        title={t("settingsSchool")}
        context="school"
        footer={
          isDirty ? (
            <YStack gap={10}>
              {submitError ? (
                <Text fontSize={12.5} fontWeight="$secondary" color="$trashText" textAlign="center">
                  {submitError}
                </Text>
              ) : null}
              <PrimaryButton label={t("save")} accent="school" onPress={handleSave} loading={isSaving} />
            </YStack>
          ) : undefined
        }
      >
        <YStack gap={16}>
          <FormCard icon={Building2} accent="school" title={t("settingsBasicInfo")} subtitle={t("settingsBasicInfoHint")}>
            <TextField
              label={t("schoolNameLabel")}
              value={name}
              onChangeText={change("name", setName)}
              placeholder={t("schoolNamePlaceholder")}
              accent="school"
              inset
              maxLength={100}
              autoCapitalize="words"
              error={errors.name}
            />
            <TextField
              label={t("fieldAddress")}
              value={address}
              onChangeText={change("address", setAddress)}
              placeholder={t("fieldAddressPlaceholder")}
              icon={MapPin}
              accent="school"
              inset
              maxLength={500}
              autoCapitalize="sentences"
              error={errors.address}
            />
          </FormCard>

          <FormCard
            icon={CreditCard}
            accent="payments"
            title={t("settingsPaymentDefaults")}
            subtitle={t("settingsPaymentDefaultsHint")}
          >
            <XStack gap={12}>
              <YStack flex={5} minWidth={0}>
                <TextField
                  label={t("settingsDefaultAmount")}
                  value={amount}
                  onChangeText={change("defaultPaymentAmount", setAmount)}
                  placeholder="0"
                  accent="school"
                  inset
                  keyboardType="decimal-pad"
                  error={errors.defaultPaymentAmount}
                />
              </YStack>
              <YStack flex={3} minWidth={0}>
                <SelectField
                  label={t("fieldCurrency")}
                  value={currency}
                  onPress={() => setCurrencyOpen(true)}
                  open={currencyOpen}
                  accent="school"
                  inset
                />
              </YStack>
            </XStack>
          </FormCard>

          <Text fontSize={13} fontWeight="$secondary" lineHeight={19} color="$neutralMuted" paddingHorizontal={4}>
            {t("settingsDefaultsNote")}
          </Text>
        </YStack>
      </SubScreenPage>

      <CurrencySheet
        open={currencyOpen}
        onOpenChange={setCurrencyOpen}
        options={SUPPORTED_CURRENCIES}
        value={currency}
        accent="school"
        onSelect={(value) => {
          if (value !== currency) change("defaultCurrency", setCurrency)(value);
        }}
      />
    </>
  );
};
