import { ListIcon, ListRow, StatusBadge } from "@/core/components";
import { CreditCard } from "lucide-react-native";
import { Text, YStack } from "tamagui";
import { PAYMENT_STATUS_STYLE } from "../constants";
import type { StudentPaymentItem } from "../hooks/useStudentPayments";
import {
  dateLocaleTag,
  describePeriod,
  formatAmount,
  isCurrentPeriod,
  localDayKey,
  storedDayKey,
} from "../paymentPeriod";
import { CurrentBadge } from "./CurrentBadge";
import { PAYMENT_METHOD_LABEL } from "../constants";

export interface PaymentRowProps {
  item: StudentPaymentItem;
}

/** "October 2026 CURRENT" / "1 – 31 Oct · Transfer"; amount over the status badge on the right. */
export function PaymentRow({ item }: PaymentRowProps) {
  const start = storedDayKey(item.cycle.periodStart);
  const end = storedDayKey(item.cycle.periodEnd);
  const { kind, title, range } = describePeriod(start, end, dateLocaleTag(t("locale")));
  const when = kind === "custom" ? t("paymentsCustomPeriod") : kind === "week" ? t("paymentsWeekPeriod") : range;
  const style = PAYMENT_STATUS_STYLE[item.status];

  return (
    <ListRow
      title={title}
      badge={isCurrentPeriod(start, end, localDayKey(new Date())) ? <CurrentBadge /> : undefined}
      subtitle={item.status === "paid" ? `${when} · ${t(PAYMENT_METHOD_LABEL[item.method])}` : when}
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
