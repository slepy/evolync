import {
  DatePickerInput,
  Header,
  HeaderTitle,
  SubmitComponent,
} from "@/modules/core/components";

import { usePaymentCycles } from "@/modules/payments";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfYear,
  endOfYear,
} from "date-fns";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView, YStack, Label, Text, Button } from "tamagui";

enum PeriodType {
  ThisYear = "this_year",
  ThisMonth = "this_month",
  ThisWeek = "this_week",
  Custom = "custom",
}

const PERIOD_TYPE_LABELS: Record<PeriodType, string> = {
  [PeriodType.ThisYear]: "paymentsThisYear",
  [PeriodType.ThisMonth]: "paymentsThisMonth",
  [PeriodType.ThisWeek]: "paymentsThisWeek",
  [PeriodType.Custom]: "paymentsCustom",
};

/**
 * Screen for creating a new payment cycle
 *
 * Route: /school/[schoolId]/payments/create
 *
 * Features:
 * - Form with period dates
 * - Date pickers for period selection
 * - Offline support
 * - Auto-navigation on success
 */
export default function CreatePaymentCycleScreen() {
  const { schoolId } = useLocalSearchParams<{ schoolId: string }>();
  const router = useRouter();
  const { createCycle } = usePaymentCycles(schoolId);
  const insets = useSafeAreaInsets();

  const [periodType, setPeriodType] = useState<PeriodType>(
    PeriodType.ThisMonth,
  );
  const [periodStart, setPeriodStart] = useState(startOfMonth(new Date()));
  const [periodEnd, setPeriodEnd] = useState(endOfMonth(new Date()));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePeriodTypeChange = (type: PeriodType) => {
    setPeriodType(type);
    const now = new Date();
    if (type === PeriodType.ThisMonth) {
      setPeriodStart(startOfMonth(now));
      setPeriodEnd(endOfMonth(now));
    } else if (type === PeriodType.ThisWeek) {
      setPeriodStart(startOfWeek(now, { weekStartsOn: 1 }));
      setPeriodEnd(endOfWeek(now, { weekStartsOn: 1 }));
    } else if (type === PeriodType.ThisYear) {
      setPeriodStart(startOfYear(now));
      setPeriodEnd(endOfYear(now));
    }
  };

  const handleSubmit = async () => {
    if (!schoolId) return;

    if (periodEnd < periodStart) {
      setError(t("paymentsErrorEndBeforeStart"));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const cycle = await createCycle({
        periodStart: periodStart.toISOString().split("T")[0],
        periodEnd: periodEnd.toISOString().split("T")[0],
      });

      if (cycle) {
        router.replace(`/school/${schoolId}/payments/${cycle.id}`);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("errorCreateFailed");
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(t("locale") === "pl" ? "pl-PL" : "en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header
        onBack={() => router.back()}
        centerContent={<HeaderTitle text={t("paymentsCreateTitle")} />}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <YStack flex={1}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              padding: 20,
              paddingBottom: 100,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <YStack
              maxWidth={500}
              width="100%"
              alignSelf="center"
              gap="$4"
              paddingVertical="$6"
            >
              {error && (
                <YStack backgroundColor="$red3" padding="$3" borderRadius="$3">
                  <Text color="$red10">{error}</Text>
                </YStack>
              )}

              {/* Period Type Selection */}
              <YStack gap="$2">
                <Label>{t("paymentsPeriodType")}</Label>
                <YStack gap="$2">
                  {Object.values(PeriodType).map((type) => (
                    <Button
                      key={type}
                      size="$4"
                      theme={periodType === type ? "green" : "gray"}
                      onPress={() => handlePeriodTypeChange(type)}
                    >
                      {t(PERIOD_TYPE_LABELS[type])}
                    </Button>
                  ))}
                </YStack>
              </YStack>

              {/* Period summary for non-custom types */}
              {periodType !== PeriodType.Custom && (
                <YStack
                  backgroundColor="$softGrayLight"
                  padding="$3"
                  borderRadius="$3"
                  gap="$1"
                >
                  <Text fontSize="$3" color="$inkBlackLight">
                    {t("paymentsPeriodStart")}: {formatDate(periodStart)}
                  </Text>
                  <Text fontSize="$3" color="$inkBlackLight">
                    {t("paymentsPeriodEnd")}: {formatDate(periodEnd)}
                  </Text>
                </YStack>
              )}

              {/* Custom date pickers - only shown when custom is selected */}
              {periodType === PeriodType.Custom && (
                <>
                  <DatePickerInput
                    label={t("paymentsPeriodStart")}
                    value={periodStart}
                    onChange={setPeriodStart}
                  />
                  <DatePickerInput
                    label={t("paymentsPeriodEnd")}
                    value={periodEnd}
                    onChange={setPeriodEnd}
                    minimumDate={periodStart}
                  />
                </>
              )}
            </YStack>
          </ScrollView>

          {/* Floating Submit Button */}
          <SubmitComponent
            onPress={handleSubmit}
            isLoading={isLoading}
            disabled={isLoading}
            title={t("paymentsCreateSubmit")}
          />
        </YStack>
      </KeyboardAvoidingView>
    </View>
  );
}
