import {
  ListCard,
  ListEmpty,
  ListIcon,
  ListRow,
  ListSection,
  StatusBadge,
  StatusSummary,
  SubScreenPage,
} from "@/core/components";
import { LoadingScreen } from "@/modules/core/components/LoadingScreen";
import { CreditCard, Wallet } from "lucide-react-native";
import React from "react";
import { Text, YStack } from "tamagui";
import { PAYMENT_STATUS_STYLE, PAYMENT_SUMMARY_ORDER } from "../constants";
import { useStudentPayments, type StudentPaymentItem } from "../hooks/useStudentPayments";
import {
  amountsByStatus,
  dateLocaleTag,
  describePeriod,
  formatAmount,
  formatCurrencyAmounts,
  isCurrentPeriod,
  localDayKey,
  storedDayKey,
} from "../paymentPeriod";
import { CurrentBadge } from "./CurrentBadge";

const METHOD_LABEL = { cash: "paymentsMethodCash", transfer: "paymentsMethodTransfer", other: "paymentsMethodOther" } as const;

/**
 * The student's own payments, read-only: Status summary of the billing
 * periods with the amount still to pay, then one row per period with the
 * amount over its status badge. Without a membership: the pending info.
 */
export const StudentPaymentsScreen: React.FC<{ memberId: string | undefined }> = ({ memberId }) => {
  const { payments, stats, isLoading } = useStudentPayments(memberId);

  if (memberId && isLoading) return <LoadingScreen />;

  const toPay = amountsByStatus(payments).pending;

  return (
    <SubScreenPage title={t("paymentsTitle")} context="student">
      {!memberId ? (
        <ListEmpty text={t("pendingMembershipInfo")} />
      ) : payments.length === 0 ? (
        <ListEmpty text={t("emptyNoPayments")} />
      ) : (
        <>
          <StatusSummary
            title={t("studentPeriodsCount", { count: stats.total })}
            subtitle={
              toPay.length > 0 ? t("paymentsToPay", { amount: formatCurrencyAmounts(toPay) }) : t("paymentsNothingToPay")
            }
            items={PAYMENT_SUMMARY_ORDER.map((status) => {
              const style = PAYMENT_STATUS_STYLE[status];
              return {
                key: status,
                count: stats[status],
                label: t(style.label),
                icon: status === "paid" ? Wallet : style.icon,
                barColor: style.barColor,
                iconColor: style.tint,
              };
            })}
          />
          <ListSection title={t("paymentsBillingPeriods")}>
            <ListCard aria-label={t("paymentsBillingPeriods")}>
              {payments.map((item) => (
                <PaymentRow key={item.recordId} item={item} />
              ))}
            </ListCard>
          </ListSection>
        </>
      )}
    </SubScreenPage>
  );
};

/** "October 2026 CURRENT" / "1 – 31 Oct · Transfer"; amount over the status badge on the right. */
function PaymentRow({ item }: { item: StudentPaymentItem }) {
  const start = storedDayKey(item.cycle.periodStart);
  const end = storedDayKey(item.cycle.periodEnd);
  const { kind, title, range } = describePeriod(start, end, dateLocaleTag(t("locale")));
  const when = kind === "custom" ? t("paymentsCustomPeriod") : kind === "week" ? t("paymentsWeekPeriod") : range;
  const style = PAYMENT_STATUS_STYLE[item.status];

  return (
    <ListRow
      title={title}
      badge={isCurrentPeriod(start, end, localDayKey(new Date())) ? <CurrentBadge /> : undefined}
      subtitle={item.status === "paid" ? `${when} · ${t(METHOD_LABEL[item.method])}` : when}
      leading={<ListIcon icon={CreditCard} accent="payments" size={44} />}
      trailing={
        <YStack alignItems="flex-end" gap={5} flexShrink={0}>
          <Text fontSize={14} fontWeight="$button" color="$neutralText" numberOfLines={1}>
            {`${formatAmount(item.amount)} ${item.currency}`}
          </Text>
          <StatusBadge label={t(style.label)} color={{ tint: style.tint, fill: style.fill }} />
        </YStack>
      }
    />
  );
}
