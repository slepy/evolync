import { FormSheet, MemberAvatar, PrimaryButton, SelectField, TextField, ToggleRow } from "@/core/components";
import { parseAmount } from "@/modules/payments/paymentPeriod";
import React from "react";
import { XStack, YStack } from "tamagui";

/** Values edited in the sheet; the amount stays text while typing. */
export interface StudentPaymentAmountDraft {
  useDefault: boolean;
  amount: string;
  currency: string;
}

interface StudentPaymentAmountSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  avatarUrl?: string | null;
  rankId?: string | null;
  /** "200 PLN", shown under the switch. */
  schoolDefault?: string;
  draft: StudentPaymentAmountDraft;
  onChange: (draft: StudentPaymentAmountDraft) => void;
  /** Opens the CURRENCY picker (the parent swaps this sheet for the `CurrencySheet`). */
  onCurrencyPress: () => void;
  onSave: () => void;
  saving?: boolean;
}

/**
 * Payment amount of a student: "Use the school default" switch; switched off,
 * the student's own AMOUNT + CURRENCY used in every new payment period.
 */
export const StudentPaymentAmountSheet: React.FC<StudentPaymentAmountSheetProps> = ({
  open,
  onOpenChange,
  name,
  avatarUrl,
  rankId,
  schoolDefault,
  draft,
  onChange,
  onCurrencyPress,
  onSave,
  saving,
}) => {
  const amountValid = draft.useDefault || parseAmount(draft.amount) !== null;

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      leading={<MemberAvatar name={name} uri={avatarUrl} rankId={rankId} />}
      title={name}
      subtitle={t("studentPaymentAmount")}
      footer={
        <PrimaryButton label={t("save")} accent="payments" onPress={onSave} disabled={!amountValid} loading={saving} />
      }
    >
      <YStack gap={18}>
        <ToggleRow
          title={t("studentUseSchoolDefaultAmount")}
          hint={schoolDefault ? t("paymentsSchoolDefault", { amount: schoolDefault }) : undefined}
          label={t("studentUseSchoolDefaultAmount")}
          checked={draft.useDefault}
          onChange={(useDefault) => onChange({ ...draft, useDefault })}
          accent="payments"
        />
        {draft.useDefault ? null : (
          <XStack gap={12}>
            <YStack flex={5} minWidth={0}>
              <TextField
                label={t("fieldAmount")}
                value={draft.amount}
                onChangeText={(amount) => onChange({ ...draft, amount })}
                placeholder="0"
                keyboardType="decimal-pad"
                accent="payments"
                error={amountValid ? undefined : t("amountInvalidType")}
              />
            </YStack>
            <YStack flex={2} minWidth={0}>
              <SelectField label={t("fieldCurrency")} value={draft.currency} onPress={onCurrencyPress} accent="payments" />
            </YStack>
          </XStack>
        )}
      </YStack>
    </FormSheet>
  );
};
