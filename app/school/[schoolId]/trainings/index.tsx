import { Header, HeaderTitle } from "@/modules/core/components";
import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";
import { TrainingDayList, useSchoolUpcomingTrainings, useSchoolsWithAddress } from "@/modules/trainings";
import { useStore } from "@/store";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Spinner, YStack } from "tamagui";

/**
 * Upcoming trainings that concern this school's students: its own
 * trainings, organization trainings and private trainings with an invitee
 * from this school.
 *
 * Route: /school/[schoolId]/trainings
 */
export default function SchoolTrainingsScreen() {
  useRequireOrganizationOwner();
  const { schoolId } = useLocalSearchParams<{ schoolId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { organization, performSync } = useStore();
  const { trainings, isLoading } = useSchoolUpcomingTrainings(schoolId);
  const { schools } = useSchoolsWithAddress(organization?.id);
  const schoolNames = useMemo(() => new Map(schools.map((s) => [s.id, s.name])), [schools]);
  const schoolName = schoolNames.get(schoolId ?? "");
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
      <Header
        onBack={() => router.back()}
        centerContent={<HeaderTitle text={schoolName ? `${t("trainingsTitle")} · ${schoolName}` : t("trainingsTitle")} />}
      />
      {isLoading ? (
        <YStack flex={1} justifyContent="center" alignItems="center">
          <Spinner size="large" color="$chineseGold" />
        </YStack>
      ) : (
        <TrainingDayList
          trainings={trainings}
          schoolNames={schoolNames}
          onPressTraining={(training) =>
            router.push(`/organization/trainings/${training.id}?schoolId=${schoolId}` as any)
          }
          emptyTitle={t("trainingsEmptyUpcoming")}
          refreshing={refreshing}
          onRefresh={refresh}
        />
      )}
    </View>
  );
}
