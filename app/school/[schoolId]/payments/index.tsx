import PaymentRecord from "@/database/models/PaymentRecord";
import { PaymentStatus as PaymentStatusEnum } from "@/database/models/PaymentRecord";
import { Header, HeaderTitle } from "@/modules/core/components";
import { LoadingScreen } from "@/modules/core/components/LoadingScreen";
import { OptionsSheet } from "@/modules/core/components/OptionsSheet";
import {
  PaymentCycleCard,
  PaymentRecordRepository,
  usePaymentCycles,
} from "@/modules/payments";
import { SchoolSettingsRepository } from "@/modules/school/repositories";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, YStack } from "tamagui";

/**
 * Payment cycles list screen
 *
 * Route: /school/[schoolId]/payments
 *
 * Features:
 * - Lists all payment cycles for the school
 * - Shows payment stats per cycle
 * - FAB for creating new cycle
 * - Offline support via WatermelonDB
 */
export default function PaymentsScreen() {
  const { schoolId } = useLocalSearchParams<{ schoolId: string }>();
  const router = useRouter();
  const { cycles, isLoading, error } = usePaymentCycles(schoolId);
  const insets = useSafeAreaInsets();

  // School's configured default currency (fallback for a cycle with zero records)
  const [defaultCurrency, setDefaultCurrency] = useState("PLN");
  useEffect(() => {
    if (!schoolId) return;
    SchoolSettingsRepository.findBySchoolId(schoolId)
      .then((settings) => {
        if (settings?.defaultCurrency) setDefaultCurrency(settings.defaultCurrency);
      })
      .catch(console.error);
  }, [schoolId]);

  // All payment records for the school, observed independently of the
  // cycles list so it doesn't wait on `cycles` to resolve first (that
  // chain was the source of the visible "0/0 then 1/1" flash).
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  // Gates the first paint so the list never shows the "0/0" default before
  // this subscription's first emission arrives (mirrors the detail screen,
  // which stays on isLoading until its stats-backing data is ready).
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) {
      setPaymentRecords([]);
      setIsStatsLoading(false);
      return;
    }

    const subscription = PaymentRecordRepository.observeBySchoolId(
      schoolId,
    ).subscribe({
      next: (records: PaymentRecord[]) => {
        setPaymentRecords(records);
        setIsStatsLoading(false);
      },
      error: (err: Error) => {
        console.error("[PaymentsScreen] Payment records error:", err);
        setIsStatsLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, [schoolId]);

  // Derived in the same render as the data that feeds it - stats and list
  // are always in sync, never a stale default before a second query resolves.
  const cycleStats = useMemo(() => {
    const stats: Record<
      string,
      {
        paidCount: number;
        totalCount: number;
        paidAmount: number;
        totalAmount: number;
        currency: string;
      }
    > = {};

    for (const cycle of cycles) {
      const cycleRecords = paymentRecords.filter(
        (r) => r.paymentCycleId === cycle.id,
      );
      const paidCount = cycleRecords.filter(
        (r) => r.status === PaymentStatusEnum.PAID,
      ).length;
      stats[cycle.id] = {
        paidCount,
        totalCount: cycleRecords.length,
        paidAmount: cycleRecords
          .filter((r) => r.status === PaymentStatusEnum.PAID)
          .reduce((sum, r) => sum + r.amount, 0),
        totalAmount: cycleRecords.reduce((sum, r) => sum + r.amount, 0),
        currency: cycleRecords[0]?.currency || defaultCurrency,
      };
    }
    return stats;
  }, [cycles, paymentRecords, defaultCurrency]);

  const handleCyclePress = (cycleId: string) => {
    router.push(`/school/${schoolId}/payments/${cycleId}`);
  };

  const handleCreateCycle = () => {
    router.push(`/school/${schoolId}/payments/create`);
  };

  if (isLoading || isStatsLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header
        onBack={() => router.back()}
        centerContent={<HeaderTitle text={t("paymentsTitle")} />}
      />
      <YStack
        flex={1}
        maxWidth={500}
        width="100%"
        alignSelf="center"
        paddingVertical="$2"
      >
        {error && (
          <YStack
            backgroundColor="$red3"
            padding="$3"
            borderRadius="$3"
            marginBottom="$3"
          >
            <Text color="$red10">{error}</Text>
          </YStack>
        )}

        <FlatList
          data={cycles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          style={{ flex: 1 }}
          renderItem={({ item }) => {
            const stats = cycleStats[item.id] || {
              paidCount: 0,
              totalCount: 0,
              paidAmount: 0,
              totalAmount: 0,
              currency: "PLN",
            };
            return (
              <PaymentCycleCard
                periodStart={item.periodStart}
                periodEnd={item.periodEnd}
                paidCount={stats.paidCount}
                totalCount={stats.totalCount}
                onPress={() => handleCyclePress(item.id)}
              />
            );
          }}
          ListEmptyComponent={
            <YStack gap="$2" alignItems="center" marginTop="$10">
              <Text color="$inkBlackLight" textAlign="center">
                {t("emptyNoPaymentCycles")}
              </Text>
              <Text color="$softGrayDark" textAlign="center" fontSize="$3">
                {t("emptyNoPaymentCyclesHint")}
              </Text>
            </YStack>
          }
        />
      </YStack>

      {/* FAB - Create New Cycle */}
      <OptionsSheet
        fab={{ bottom: Platform.OS === "ios" ? 90 : 80, right: 20 }}
        action={handleCreateCycle}
      />
    </View>
  );
}
