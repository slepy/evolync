import {
  Header,
  HeaderTitle,
  LoadingScreen,
  OptionsSheet,
} from "@/modules/core/components";
import { ThreeDTabSelector } from "@/modules/threed/components";
import { useThreeDScreen } from "@/modules/threed/hooks";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack } from "tamagui";

export default function ThreeDScreen() {
  const router = useRouter();
  const { activeTab, setActiveTab, tabs, tabContent, isLoading } =
    useThreeDScreen();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header
        onBack={() => router.back()}
        centerContent={<HeaderTitle text={t("techniquesNotebook")} />}
      />

      <View style={{ flex: 1 }}>
        <ThreeDTabSelector
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={tabs}
        />

        {isLoading ? (
          <LoadingScreen />
        ) : (
          <YStack flex={1}>{tabContent[activeTab]}</YStack>
        )}

        <OptionsSheet
          fab={{ bottom: Platform.OS === "ios" ? 90 : 80, right: 20 }}
          action={() => router.push("/techniques/threed/create" as any)}
        />
      </View>
    </View>
  );
}
