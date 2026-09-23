import PaymentCycle from "@/database/models/PaymentCycle";
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
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
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

  // Track payment stats per cycle
  const [cycleStats, setCycleStats] = useState<
    Record<
      string,
      {
        paidCount: number;
        totalCount: number;
        paidAmount: number;
        totalAmount: number;
        currency: string;
      }
    >
  >({});

  // Ref to store cycle IDs for focus effect
  const cycleIdsRef = useRef<string[]>([]);

  // Update ref when cycles change
  useEffect(() => {
    cycleIdsRef.current = cycles.map((c: PaymentCycle) => c.id);
  }, [cycles]);

  // Helper function to compute stats from records
  const computeStats = useCallback(
    (records: PaymentRecord[], cycleIds: string[]) => {
      const stats: typeof cycleStats = {};

      for (const cycleId of cycleIds) {
        const cycleRecords = records.filter(
          (r) => r.paymentCycleId === cycleId,
        );
        const paidCount = cycleRecords.filter(
          (r) => r.status === PaymentStatusEnum.PAID,
        ).length;
        stats[cycleId] = {
          paidCount,
          totalCount: cycleRecords.length,
          paidAmount: cycleRecords
            .filter((r) => r.status === PaymentStatusEnum.PAID)
            .reduce((sum, r) => sum + r.amount, 0),
          totalAmount: cycleRecords.reduce((sum, r) => sum + r.amount, 0),
          currency: cycleRecords[0]?.currency || "PLN",
        };
      }
      return stats;
    },
    [],
  );

  // Function to fetch and calculate stats via repository
  const fetchStats = useCallback(
    async (cycleIds: string[]) => {
      if (cycleIds.length === 0) {
        setCycleStats({});
        return;
      }

      const records = await PaymentRecordRepository.findByCycleIds(cycleIds);
      setCycleStats(computeStats(records, cycleIds));
    },
    [computeStats],
  );

  // Refresh stats when screen gains focus
  useFocusEffect(
    useCallback(() => {
      if (cycleIdsRef.current.length > 0) {
        fetchStats(cycleIdsRef.current);
      }
    }, [fetchStats]),
  );

  // Subscribe to payment records for stats via repository
  useEffect(() => {
    if (!schoolId || cycles.length === 0) {
      setCycleStats({});
      return;
    }

    const cycleIds = cycles.map((c: PaymentCycle) => c.id);

    const subscription = PaymentRecordRepository.observeByCycleIds(
      cycleIds,
    ).subscribe({
      next: (records: PaymentRecord[]) => {
        setCycleStats(computeStats(records, cycleIds));
      },
      error: (err: Error) => {
        console.error("[PaymentsScreen] Payment stats error:", err);
      },
    });

    return () => subscription.unsubscribe();
  }, [cycles, schoolId, computeStats]);

  const handleCyclePress = (cycleId: string) => {
    router.push(`/school/${schoolId}/payments/${cycleId}`);
  };

  const handleCreateCycle = () => {
    router.push(`/school/${schoolId}/payments/create`);
  };

  if (isLoading) {
    return <LoadingScreen showLogo={false} spinnerColor="$green10" />;
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
