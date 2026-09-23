import { Header, HeaderTitle } from "@/modules/core/components";
import { LanguageSwitcher } from "@/core/components/LanguageSwitcher";
import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView, Text, YStack } from "tamagui";
import { AccountTypeCard } from "@/modules/auth/components/AccountTypeCard";

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
          paddingBottom: 40,
        }}
      >
        <YStack maxWidth={500} width="100%" alignSelf="center" gap="$6">
          <YStack gap="$3">
            <LanguageSwitcher variant="list" />
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
    </View>
  );
}
