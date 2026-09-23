import { useRouter } from "expo-router";
import { YStack, Text, ScrollView } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View } from "react-native";
import { Header, HeaderTitle } from "@/modules/core/components";
import { useStore } from "@/store";
import { StudentPaymentRow } from "@/modules/students/components";
import { PaymentCycleStats } from "@/modules/payments";
import { useStudentPayments } from "@/modules/payments/hooks";

export default function UserPaymentsScreen() {
  const router = useRouter();
  const schoolMembership = useStore((state) => state.getActiveMembership());
  const insets = useSafeAreaInsets();

  const { payments, stats } = useStudentPayments(schoolMembership?.memberId);

  if (!schoolMembership) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <Header onBack={() => router.back()} centerContent={<HeaderTitle text={t("dashboardPayments")} />} />
        <YStack flex={1} padding="$6" alignItems="center" justifyContent="center">
          <Text fontSize="$5" color="$gray11" textAlign="center">{t("pendingMembershipInfo")}</Text>
        </YStack>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header
        onBack={() => router.back()}
        centerContent={<HeaderTitle text={t("dashboardPayments")} />}
      />
      <ScrollView>
        <YStack gap="$2" paddingTop="$2">
          {/* Stats Summary */}
          {stats.total > 0 && (
            <PaymentCycleStats
              paid={stats.paid}
              pending={stats.pending}
              cancelled={stats.cancelled}
              paidByCurrency={stats.paidByCurrency}
              pendingByCurrency={stats.pendingByCurrency}
              cancelledByCurrency={stats.cancelledByCurrency}
            />
          )}

          {payments.length === 0 ? (
            <YStack
              flex={1}
              padding="$6"
              gap="$4"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize="$5" color="$gray11" textAlign="center">
                {t("emptyNoPayments")}
              </Text>
            </YStack>
          ) : (
            <YStack gap="$2">
              {payments.map((item) => (
                <StudentPaymentRow
                  key={item.recordId}
                  periodStart={item.cycle.periodStart}
                  periodEnd={item.cycle.periodEnd}
                  amount={item.amount}
                  currency={item.currency}
                  status={item.status}
                  method={item.method}
                  onLocalChange={() => {}} // No-op - read-only
                  disabled={true} // Read-only mode
                  headerPressToExpand={true}
                />
              ))}
            </YStack>
          )}
        </YStack>
      </ScrollView>
    </View>
  );
}
