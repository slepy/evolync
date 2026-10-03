import { Header, HeaderTitle, OptionsSheet } from "@/modules/core/components";
import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";
import { TrainingDayList, useSchoolsWithAddress, useUpcomingTrainings } from "@/modules/trainings";
import { useStore } from "@/store";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Spinner, Text, YStack } from "tamagui";

/**
 * All upcoming trainings in the organization, grouped by day.
 *
 * Route: /organization/trainings
 */
export default function TrainingsListScreen() {
  useRequireOrganizationOwner();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { organization, performSync } = useStore();
  const { trainings, isLoading, error } = useUpcomingTrainings(organization?.id);
  const { schools } = useSchoolsWithAddress(organization?.id);
  const schoolNames = useMemo(() => new Map(schools.map((s) => [s.id, s.name])), [schools]);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await performSync(true);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <YStack flex={1}>
        <Header onBack={() => router.back()} centerContent={<HeaderTitle text={t("trainingsTitle")} />} />
        {isLoading ? (
          <YStack flex={1} justifyContent="center" alignItems="center">
            <Spinner size="large" color="$chineseGold" />
          </YStack>
        ) : error ? (
          <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
            <Text color="$imperialRed" textAlign="center">
              {error}
            </Text>
          </YStack>
        ) : (
          <TrainingDayList
            trainings={trainings}
            schoolNames={schoolNames}
            onPressTraining={(training) => router.push(`/organization/trainings/${training.id}` as any)}
            emptyTitle={t("trainingsEmptyUpcoming")}
            emptyHint={t("trainingsEmptyUpcomingHint")}
            refreshing={refreshing}
            onRefresh={refresh}
          />
        )}
        <OptionsSheet
          fab={{ bottom: Platform.OS === "ios" ? 90 : 80, right: 20 }}
          action={() => router.push("/organization/trainings/create" as any)}
        />
      </YStack>
    </View>
  );
}
