import { ChoiceList, FormSheet, ListAvatar, PrimaryButton, SelectField, TextField, memberInitials } from "@/core/components";
import { PaymentMethod, type PaymentMethod as PaymentMethodValue } from "@/database/models/PaymentRecord";
import React from "react";
import { parseAmount } from "../paymentPeriod";
import { XStack, YStack } from "tamagui";

/** Values edited in the 14C sheet; the amount stays text while typing. */
export interface PaymentDraft {
  amount: string;
  currency: string;
  method: PaymentMethodValue;
}

const METHODS: { value: PaymentMethodValue; title: string; hint: string }[] = [
  { value: PaymentMethod.CASH, title: "paymentsMethodCash", hint: "paymentsMethodCashHint" },
  { value: PaymentMethod.TRANSFER, title: "paymentsMethodTransfer", hint: "paymentsMethodTransferHint" },
  { value: PaymentMethod.OTHER, title: "paymentsMethodOther", hint: "paymentsMethodOtherHint" },
];

interface PaymentEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  avatarUrl?: string | null;
  /** "October 2026 · Pending" */
  subtitle: string;
  draft: PaymentDraft;
  onChange: (draft: PaymentDraft) => void;
  /** Opens the CURRENCY picker (the parent swaps this sheet for the `CurrencySheet`). */
  onCurrencyPress: () => void;
  onSave: () => void;
}

/** Edit payment (14C): AMOUNT + CURRENCY, Method radio list, Save. */
export const PaymentEditSheet: React.FC<PaymentEditSheetProps> = ({
  open,
  onOpenChange,
  name,
  avatarUrl,
  subtitle,
  draft,
  onChange,
  onCurrencyPress,
  onSave,
}) => {
  const amountValid = parseAmount(draft.amount) !== null;

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      leading={<ListAvatar initials={memberInitials(name)} uri={avatarUrl} />}
      title={name}
      subtitle={subtitle}
      footer={<PrimaryButton label={t("save")} accent="payments" onPress={onSave} disabled={!amountValid} />}
    >
      <YStack gap={18}>
        <XStack gap={12}>
          <YStack flex={5} minWidth={0}>
            <TextField
              label={t("fieldAmount")}
              value={draft.amount}
              onChangeText={(amount) => onChange({ ...draft, amount })}
              keyboardType="decimal-pad"
              accent="payments"
              error={amountValid ? undefined : t("amountInvalidType")}
            />
          </YStack>
          <YStack flex={2} minWidth={0}>
            <SelectField label={t("fieldCurrency")} value={draft.currency} onPress={onCurrencyPress} accent="payments" />
          </YStack>
        </XStack>
        <ChoiceList
          title={t("paymentsMethodTitle")}
          accent="payments"
          value={draft.method}
          onChange={(method) => onChange({ ...draft, method })}
          options={METHODS.map((m) => ({ value: m.value, title: t(m.title), hint: t(m.hint) }))}
        />
      </YStack>
    </FormSheet>
  );
};
