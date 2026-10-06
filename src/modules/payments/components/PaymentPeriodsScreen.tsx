import {
  ListCard,
  ListChip,
  ListEmpty,
  ListIcon,
  ListRow,
  ListSection,
  SubScreenPage,
  rateAccent,
} from "@/core/components";
import { LoadingScreen } from "@/modules/core/components/LoadingScreen";
import { CreditCard } from "lucide-react-native";
import React from "react";
import { Text, View } from "tamagui";
import { usePaymentPeriodList, type PaymentPeriodEntry } from "../hooks/usePaymentPeriodList";
import { dateLocaleTag, describePeriod, isCurrentPeriod, localDayKey } from "../paymentPeriod";

interface PaymentPeriodsScreenProps {
  schoolId: string;
  onPeriodPress: (cycleId: string) => void;
  onAdd: () => void;
}

/** Payments (14A): "Billing periods" with Add new; each row shows the period, "6 of 10 paid" and the paid chip. */
export const PaymentPeriodsScreen: React.FC<PaymentPeriodsScreenProps> = ({ schoolId, onPeriodPress, onAdd }) => {
  const { periods, isLoading, error } = usePaymentPeriodList(schoolId);

  if (isLoading) return <LoadingScreen />;

  return (
    <SubScreenPage title={t("paymentsTitle")} context="school">
      {error ? (
        <Text fontSize={13} fontWeight="$secondary" color="$trashText">
          {error}
        </Text>
      ) : null}
      <ListSection
        title={t("paymentsBillingPeriods")}
        accent="payments"
        action={{ label: t("addNew"), onPress: onAdd }}
      >
        {periods.length === 0 ? (
          <ListEmpty text={t("emptyNoPaymentCycles")} />
        ) : (
          <ListCard aria-label={t("paymentsBillingPeriods")}>
            {periods.map((period) => (
              <PeriodRow key={period.cycle.id} period={period} onPress={() => onPeriodPress(period.cycle.id)} />
            ))}
          </ListCard>
        )}
      </ListSection>
    </SubScreenPage>
  );
};

function PeriodRow({ period, onPress }: { period: PaymentPeriodEntry; onPress: () => void }) {
  const { kind, title, range } = describePeriod(period.start, period.end, dateLocaleTag(t("locale")));
  const when = kind === "custom" ? t("paymentsCustomPeriod") : kind === "week" ? t("paymentsWeekPeriod") : range;
  const current = isCurrentPeriod(period.start, period.end, localDayKey(new Date()));

  return (
    <ListRow
      title={title}
      badge={current ? <CurrentBadge /> : undefined}
      subtitle={`${when} · ${t("paymentsPaidOf", { paid: period.paid, total: period.total })}`}
      leading={<ListIcon icon={CreditCard} accent="payments" size={44} />}
      trailing={<ListChip label={`${period.paid}/${period.total}`} accent={rateAccent(period.paid, period.total)} />}
      onPress={onPress}
    />
  );
}

/** "CURRENT" tag after the title of the period that contains today. */
function CurrentBadge() {
  return (
    <View paddingVertical={2} paddingHorizontal={8} borderRadius={8} backgroundColor="$paymentsFill" flexShrink={0}>
      <Text fontSize={10.5} fontWeight="$button" letterSpacing={0.6} textTransform="uppercase" color="$paymentsTint">
        {t("paymentsCurrent")}
      </Text>
    </View>
  );
}
