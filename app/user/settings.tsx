import { MainNav, useBottomNavSpace } from "@/core/components";
import { Header, HeaderTitle } from "@/modules/core/components";
import { LanguageSwitcher } from "@/core/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/core/components/ThemeSwitcher";
import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView, Text, YStack } from "tamagui";
import { AccountTypeCard } from "@/modules/auth/components/AccountTypeCard";
import { PushNotificationsSetting } from "@/modules/notifications";

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const navSpace = useBottomNavSpace();

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header
        onBack={() => router.back()}
        centerContent={<HeaderTitle text={t("settingsTitle")} />}
        showLogoMenu={false}
      />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: 20,
          paddingBottom: navSpace,
        }}
      >
        <YStack maxWidth={500} width="100%" alignSelf="center" gap="$6">
          <YStack gap="$3">
            <LanguageSwitcher variant="list" />
            <ThemeSwitcher variant="list" />
            <PushNotificationsSetting />
            {/*  <AccountTypeCard
              title={t("createOrganization")}
              description={t("createOrganizationDescription")}
              icon="owner"
            />
 */}
            <AccountTypeCard
              title={t("joinAnotherSchool")}
              icon="student"
              onPress={() => router.push("/school/join")}
            />
          </YStack>
        </YStack>
      </ScrollView>
      <MainNav />
    </View>
  );
}
