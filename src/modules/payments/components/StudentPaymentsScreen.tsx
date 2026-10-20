import { ListCard, ListEmpty, ListSection, StatusSummary, SubScreenPage } from "@/core/components";
import { LoadingScreen } from "@/core/components";
import { Wallet } from "lucide-react-native";
import React from "react";
import { PAYMENT_STATUS_STYLE, PAYMENT_SUMMARY_ORDER } from "../constants";
import { useStudentPayments } from "../hooks/useStudentPayments";
import { amountsByStatus, formatCurrencyAmounts } from "../paymentPeriod";
import { PaymentRow } from "./PaymentRow";


export interface StudentPaymentsScreenProps {
  memberId: string | undefined;
}

/**
 * The student's own payments, read-only: Status summary of the billing
 * periods with the amount still to pay, then one row per period with the
 * amount over its status badge. Without a membership: the pending info.
 */
export const StudentPaymentsScreen: React.FC<StudentPaymentsScreenProps> = ({ memberId }) => {
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
