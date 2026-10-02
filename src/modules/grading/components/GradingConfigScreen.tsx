import {
  Header,
  HeaderTitle,
  LoadingScreen,
  OptionsSheet,
} from "@/modules/core/components";
import { useStore } from "@/store";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList } from "react-native";
import { RankListItem } from "./RankListItem";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, View, YStack } from "tamagui";
import { useGradingRanks } from "../hooks/useGradingRanks";

export const GradingConfigScreen: React.FC = () => {
  const router = useRouter();
  const { organization } = useStore();
  const { ranks, isLoading } = useGradingRanks(organization?.id || "");
  const insets = useSafeAreaInsets();

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header
        onBack={() => router.back()}
        centerContent={<HeaderTitle text={t("gradingConfigTitle")} />}
      />

      <FlatList
        data={ranks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 8 }}
        renderItem={({ item }) => (
          <RankListItem
            id={item.id}
            name={item.name}
            color={item.color}
            onPress={() => router.push(`/organization/grading/${item.id}/edit`)}
          />
        )}
        ListEmptyComponent={
          <YStack
            alignItems="center"
            paddingVertical="$8"
            paddingHorizontal="$6"
          >
            <Text fontSize="$4" color="$textSecondary" textAlign="center">
              {t("gradingEmptyState")}
            </Text>
          </YStack>
        }
      />

      <OptionsSheet
        fab={{}}
        action={() => router.push("/organization/grading/create")}
      />
    </View>
  );
};
