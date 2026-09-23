import PaymentCycle from "@/database/models/PaymentCycle";
import {
  Header,
  HeaderTitle,
  SubmitComponent,
} from "@/modules/core/components";
import { LoadingScreen } from "@/modules/core/components/LoadingScreen";
import {
  PaymentCycleRepository,
  PaymentCycleStats,
  PaymentRecordRow,
  usePaymentRecords,
} from "@/modules/payments";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Users } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { FlatList, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, YStack, useTheme } from "tamagui";
import { format } from "date-fns";
import { pl, enUS } from "date-fns/locale";

/**
 * Payment cycle detail screen
 *
 * Route: /school/[schoolId]/payments/[cycleId]
 *
 * Features:
 * - Shows all school members with payment status
 * - Mark payment as paid by tapping button
 * - Payment statistics
 * - Offline support
 */
export default function PaymentCycleDetailScreen() {
  const { schoolId, cycleId } = useLocalSearchParams<{
    schoolId: string;
    cycleId: string;
  }>();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [cycle, setCycle] = useState<PaymentCycle | null>(null);

  const {
    paymentList,
    stats,
    isLoading,
    isSaving,
    error,
    updateLocal,
    saveAll,
  } = usePaymentRecords(cycleId, schoolId);

  // Load cycle details via repository
  useEffect(() => {
    if (!cycleId) return;

    const subscription = PaymentCycleRepository.observeById(cycleId).subscribe({
      next: (loadedCycle: PaymentCycle) => {
        setCycle(loadedCycle);
      },
      error: (err: Error) => {
        console.error("[PaymentCycleDetailScreen] Load cycle error:", err);
      },
    });

    return () => subscription.unsubscribe();
  }, [cycleId]);

  const handleSave = async () => {
    try {
      await saveAll();
      router.back();
    } catch (err) {
      console.error("[PaymentCycleDetailScreen] Save error:", err);
    }
  };

  // Format date for header
  const formatHeaderTitle = (cycle: PaymentCycle): string => {
    const locale = t("locale") === "pl" ? pl : enUS;
    const start = format(cycle.periodStart, "d MMM", { locale });
    const end = format(cycle.periodEnd, "d MMM yyyy", { locale });
    return `${start} - ${end}`;
  };

  if (isLoading || !cycle) {
    return <LoadingScreen showLogo={false} spinnerColor="$green10" />;
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header
        onBack={() => router.back()}
        centerContent={<HeaderTitle text={formatHeaderTitle(cycle)} />}
      />

      <YStack flex={1} maxWidth={500} width="100%" alignSelf="center">
        {error && (
          <YStack
            backgroundColor="$red3"
            padding="$3"
            borderRadius="$3"
            marginVertical="$2"
          >
            <Text color="$red10">{error}</Text>
          </YStack>
        )}

        <PaymentCycleStats
          paid={stats.paid}
          pending={stats.pending}
          cancelled={stats.cancelled}
          paidByCurrency={stats.paidByCurrency}
          pendingByCurrency={stats.pendingByCurrency}
          cancelledByCurrency={stats.cancelledByCurrency}
        />

        {/* Members List */}
        <FlatList
          data={paymentList}
          keyExtractor={(item) => item.member.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          style={{ flex: 1 }}
          renderItem={({ item }) => (
            <PaymentRecordRow
              member={item.member}
              amount={item.amount}
              currency={item.currency}
              status={item.status}
              method={item.method}
              onChange={(data) => updateLocal(item.member.id, data)}
              disabled={isSaving}
            />
          )}
          ListEmptyComponent={
            <YStack gap="$2" alignItems="center" marginTop="$10">
              <Users size={48} color={theme.softGrayDark?.val} />
              <Text color="$inkBlackLight" textAlign="center">
                {t("emptyNoMembers")}
              </Text>
              <Text color="$softGrayDark" textAlign="center" fontSize="$3">
                {t("emptyNoMembersHint")}
              </Text>
            </YStack>
          }
        />

        {/* Save Button - always visible */}
        <SubmitComponent
          onPress={handleSave}
          isLoading={isSaving}
          disabled={isSaving}
          title={t("paymentsSave")}
        />
      </YStack>
    </View>
  );
}
