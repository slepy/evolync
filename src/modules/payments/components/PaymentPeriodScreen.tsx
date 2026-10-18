import {
  CurrencySheet,
  MemberAvatar,
  ListCard,
  ListChip,
  ListEmpty,
  ListIcon,
  ListRow,
  PrimaryButton,
  StatusButton,
  StatusSummary,
  SubScreenPage,
  ratePercent,
} from "@/core/components";
import PaymentCycle from "@/database/models/PaymentCycle";
import { LoadingScreen } from "@/core/components";
import { SUPPORTED_CURRENCIES } from "@/core/utils/currencies";
import { neutral } from "@/core/theme/tokens";
import { ChevronDown, ChevronUp, Wallet } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Text, XStack, YStack } from "tamagui";
import { PAYMENT_STATUS_STYLE, PAYMENT_SUMMARY_ORDER } from "../constants";
import { usePaymentRecords, type PaymentWithMember } from "../hooks/usePaymentRecords";
import {
  amountsByStatus,
  countPaymentStatuses,
  dateLocaleTag,
  describePeriod,
  formatAmount,
  nextPaymentStatus,
  parseAmount,
  storedDayKey,
} from "../paymentPeriod";
import { PaymentCycleRepository } from "../repositories";
import { PaymentEditSheet, type PaymentDraft } from "./PaymentEditSheet";

const METHOD_LABEL = { cash: "paymentsMethodCash", transfer: "paymentsMethodTransfer", other: "paymentsMethodOther" } as const;

/** True when the edited values differ from the stored record. */
const isChanged = (item: PaymentWithMember): boolean =>
  !!item.record &&
  (item.status !== item.record.status ||
    item.amount !== item.record.amount ||
    item.currency !== item.record.currency ||
    item.method !== item.record.method);

interface PaymentPeriodScreenProps {
  schoolId: string;
  cycleId: string;
  /** After Save: back to the billing periods. */
  onSaved: () => void;
}

/**
 * Period details (14B / 14B1): Status summary with the collapsible Amounts,
 * member rows (name opens Edit payment 14C, the status button cycles
 * Pending → Paid → Cancelled); Save appears after a change.
 */
export const PaymentPeriodScreen: React.FC<PaymentPeriodScreenProps> = ({ schoolId, cycleId, onSaved }) => {
  const [cycle, setCycle] = useState<PaymentCycle | null>(null);
  const { paymentList, isLoading, isSaving, error, updateLocal, saveAll } = usePaymentRecords(cycleId, schoolId);
  const [amountsOpen, setAmountsOpen] = useState(false);
  const [editing, setEditing] = useState<{ memberId: string; draft: PaymentDraft } | null>(null);
  const [sheet, setSheet] = useState<"edit" | "currency" | null>(null);

  useEffect(() => {
    const subscription = PaymentCycleRepository.observeById(cycleId).subscribe({
      next: setCycle,
      error: (err: Error) => console.error("[PaymentPeriodScreen] Load period error:", err),
    });
    return () => subscription.unsubscribe();
  }, [cycleId]);

  if (isLoading || !cycle) return <LoadingScreen />;

  const periodTitle = describePeriod(storedDayKey(cycle.periodStart), storedDayKey(cycle.periodEnd), dateLocaleTag(t("locale"))).title;
  const counts = countPaymentStatuses(paymentList);
  const amounts = amountsByStatus(paymentList);
  const changed = paymentList.some(isChanged);
  const editedItem = editing ? paymentList.find((item) => item.member.id === editing.memberId) : undefined;

  const openEdit = (item: PaymentWithMember) => {
    setEditing({
      memberId: item.member.id,
      draft: { amount: formatAmount(item.amount), currency: item.currency, method: item.method },
    });
    setSheet("edit");
  };

  const saveEdit = () => {
    if (!editing || !editedItem) return;
    const amount = parseAmount(editing.draft.amount);
    if (amount === null) return;
    updateLocal(editing.memberId, {
      status: editedItem.status,
      amount,
      currency: editing.draft.currency,
      method: editing.draft.method,
    });
    setSheet(null);
  };

  const handleSave = async () => {
    try {
      await saveAll();
      onSaved();
    } catch {
      // The hook keeps the error, shown above the button.
    }
  };

  return (
    <SubScreenPage
      title={periodTitle}
      context="school"
      footer={
        changed ? (
          <YStack gap={10}>
            {error ? (
              <Text fontSize={12.5} fontWeight="$secondary" color="$trashText" textAlign="center">
                {error}
              </Text>
            ) : null}
            <PrimaryButton label={t("save")} accent="payments" onPress={handleSave} loading={isSaving} />
          </YStack>
        ) : undefined
      }
    >
      <YStack gap={16}>
        <StatusSummary
          title={t("membersCount", { count: paymentList.length })}
          subtitle={t("paymentsPaidSummary", { count: counts.paid, percent: ratePercent(counts.paid, paymentList.length) })}
          accent="payments"
          items={PAYMENT_SUMMARY_ORDER.map((status) => {
            const style = PAYMENT_STATUS_STYLE[status];
            return {
              key: status,
              count: counts[status],
              label: t(style.label),
              icon: style.icon,
              barColor: style.barColor,
              iconColor: style.tint,
            };
          })}
        >
          <AmountsToggle open={amountsOpen} onPress={() => setAmountsOpen((open) => !open)} />
          {amountsOpen ? (
            <YStack gap={8}>
              {PAYMENT_SUMMARY_ORDER.map((status) => (
                <XStack key={status} alignItems="center" gap={8} flexWrap="wrap">
                  <Text
                    width={92}
                    fontSize={12}
                    fontWeight="$eyebrow"
                    letterSpacing={0.8}
                    textTransform="uppercase"
                    color="$neutralMuted"
                    numberOfLines={1}
                  >
                    {t(PAYMENT_STATUS_STYLE[status].amountsLabel)}
                  </Text>
                  {amounts[status].length > 0 ? (
                    amounts[status].map(({ currency, amount }) => (
                      <ListChip
                        key={currency}
                        label={`${formatAmount(amount)} ${currency}`}
                        accent={status === "paid" ? "success" : status === "pending" ? "warning" : "neutral"}
                      />
                    ))
                  ) : (
                    <Text fontSize={13} fontWeight="$secondary" color="$neutralMuted">
                      –
                    </Text>
                  )}
                </XStack>
              ))}
            </YStack>
          ) : null}
        </StatusSummary>

        <Text fontSize={13} fontWeight="$secondary" lineHeight={19} color="$neutralMuted">
          {t("paymentsStatusHint")}
        </Text>

        {paymentList.length === 0 ? (
          <ListEmpty text={t("emptyNoMembers")} hint={t("emptyNoMembersHint")} />
        ) : (
          <ListCard>
            {paymentList.map((item) => {
              const name = item.member.displayName || t("unknownMember");
              const style = PAYMENT_STATUS_STYLE[item.status];
              const amount = `${formatAmount(item.amount)} ${item.currency}`;
              return (
                <ListRow
                  key={item.member.id}
                  size="md"
                  title={name}
                  subtitle={item.status === "paid" ? `${amount} · ${t(METHOD_LABEL[item.method])}` : amount}
                  aria-label={t("paymentsEditPayment", { name })}
                  onPress={isSaving ? undefined : () => openEdit(item)}
                  leading={<MemberAvatar name={name} uri={item.member.avatarUrl} rankId={item.member.currentRankId} />}
                  trailing={
                    <StatusButton
                      icon={style.icon}
                      color={{ tint: style.tint, fill: style.fill }}
                      label={t("statusChangeNow", { status: t(style.label) })}
                      disabled={isSaving}
                      onPress={() =>
                        updateLocal(item.member.id, {
                          status: nextPaymentStatus(item.status),
                          amount: item.amount,
                          currency: item.currency,
                          method: item.method,
                        })
                      }
                    />
                  }
                />
              );
            })}
          </ListCard>
        )}
      </YStack>

      {editing && editedItem ? (
        <>
          <PaymentEditSheet
            open={sheet === "edit"}
            onOpenChange={(open) => setSheet(open ? "edit" : null)}
            name={editedItem.member.displayName || t("unknownMember")}
            avatarUrl={editedItem.member.avatarUrl}
            rankId={editedItem.member.currentRankId}
            subtitle={`${periodTitle} · ${t(PAYMENT_STATUS_STYLE[editedItem.status].label)}`}
            draft={editing.draft}
            onChange={(draft) => setEditing({ ...editing, draft })}
            onCurrencyPress={() => setSheet("currency")}
            onSave={saveEdit}
          />
          <CurrencySheet
            open={sheet === "currency"}
            onOpenChange={(open) => setSheet(open ? "currency" : "edit")}
            options={SUPPORTED_CURRENCIES}
            value={editing.draft.currency}
            accent="payments"
            onSelect={(currency) => {
              setEditing({ ...editing, draft: { ...editing.draft, currency } });
              setSheet("edit");
            }}
          />
        </>
      ) : null}
    </SubScreenPage>
  );
};

/** "Amounts" row under the summary legend (14B collapsed / 14B1 expanded). */
function AmountsToggle({ open, onPress }: { open: boolean; onPress: () => void }) {
  const Chevron = open ? ChevronUp : ChevronDown;
  return (
    <XStack
      role="button"
      aria-label={t("paymentsAmounts")}
      aria-expanded={open}
      onPress={onPress}
      pressStyle={{ opacity: 0.85 }}
      alignItems="center"
      gap={8}
      minHeight={44}
      marginVertical={-6}
      marginHorizontal={-4}
      paddingHorizontal={4}
    >
      <ListIcon icon={Wallet} accent="payments" size={32} />
      <Text flex={1} fontSize={14} fontWeight="$button" color="$neutralText">
        {t("paymentsAmounts")}
      </Text>
      <Chevron size={18} color={neutral.muted} strokeWidth={2.2} />
    </XStack>
  );
}
