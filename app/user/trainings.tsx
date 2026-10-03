import { Header, HeaderTitle } from "@/modules/core/components";
import { TrainingDayList, useSchoolUpcomingTrainings } from "@/modules/trainings";
import { useStore } from "@/store";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Spinner, YStack } from "tamagui";
import { withObservables } from "@nozbe/watermelondb/react";
import { SchoolRepository } from "@/modules/school/repositories";
import type School from "@/database/models/School";

/**
 * Read-only list of upcoming trainings the student is in the audience of,
 * for the active school membership. No edit affordances.
 *
 * Route: /user/trainings
 */
function UserTrainingsScreenInner({ schools }: { schools: School[] }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const membership = useStore((state) => state.getActiveMembership());
  const performSync = useStore((state) => state.performSync);
  const { trainings, isLoading } = useSchoolUpcomingTrainings(membership?.schoolId);
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
      <Header onBack={() => router.back()} centerContent={<HeaderTitle text={t("trainingsUpcomingTitle")} />} />
      {isLoading ? (
        <YStack flex={1} justifyContent="center" alignItems="center">
          <Spinner size="large" color="$chineseGold" />
        </YStack>
      ) : (
        <TrainingDayList
          trainings={trainings}
          schoolNames={schoolNames}
          emptyTitle={t("trainingsEmptyStudent")}
          refreshing={refreshing}
          onRefresh={refresh}
        />
      )}
    </View>
  );
}

const enhance = withObservables([], () => ({
  schools: SchoolRepository.observeAll(),
}));

export default enhance(UserTrainingsScreenInner);
