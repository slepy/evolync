import {
  ErrorBanner,
  Header,
  HeaderTitle,
  SubmitComponent,
} from "@/modules/core/components";

import { useCreateInvite } from "@/modules/school/hooks";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView, YStack, Text, XStack, Label, RadioGroup } from "tamagui";
import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";

export default function GenerateInviteScreen() {
  useRequireOrganizationOwner();
  const { schoolId } = useLocalSearchParams<{ schoolId: string }>();
  const router = useRouter();
  const { createInvite, isLoading, error } = useCreateInvite();
  const [expirationDays, setExpirationDays] = useState("7");
  const [showError, setShowError] = useState(false);
  const insets = useSafeAreaInsets();

  // Show error banner when error occurs
  useEffect(() => {
    if (error) {
      setShowError(true);
    }
  }, [error]);

  const handleGenerate = async () => {
    if (!schoolId) return;

    const days = parseInt(expirationDays);
    const expiresAt = Date.now() + days * 24 * 60 * 60 * 1000;

    const invite = await createInvite(schoolId, expiresAt);
    if (invite) {
      router.back();
    }
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header
        onBack={() => router.back()}
        centerContent={<HeaderTitle text={t("inviteGenerateTitle")} />}
      />

      <YStack flex={1}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            padding: 20,
            paddingBottom: 100,
          }}
        >
          <YStack maxWidth={500} width="100%" alignSelf="center" gap="$6">
            {error && showError && (
              <ErrorBanner
                title={t("inviteCreateError")}
                message={error}
                onDismiss={() => setShowError(false)}
              />
            )}

            <YStack gap="$4">
              <Text fontSize="$5" fontWeight="bold">
                {t("inviteExpirationTime")}
              </Text>
              <Text color="$inkBlackLight">
                {t("inviteExpirationDescription")}
              </Text>

              <RadioGroup
                value={expirationDays}
                onValueChange={setExpirationDays}
              >
                <YStack gap="$3">
                  <XStack alignItems="center" gap="$3">
                    <RadioGroup.Item value="1" id="1-day" size="$4">
                      <RadioGroup.Indicator />
                    </RadioGroup.Item>
                    <Label htmlFor="1-day" size="$4">
                      {t("inviteExpiration1Day")}
                    </Label>
                  </XStack>
                  <XStack alignItems="center" gap="$3">
                    <RadioGroup.Item value="7" id="7-days" size="$4">
                      <RadioGroup.Indicator />
                    </RadioGroup.Item>
                    <Label htmlFor="7-days" size="$4">
                      {t("inviteExpiration7Days")}
                    </Label>
                  </XStack>
                  <XStack alignItems="center" gap="$3">
                    <RadioGroup.Item value="30" id="30-days" size="$4">
                      <RadioGroup.Indicator />
                    </RadioGroup.Item>
                    <Label htmlFor="30-days" size="$4">
                      {t("inviteExpiration30Days")}
                    </Label>
                  </XStack>
                </YStack>
              </RadioGroup>
            </YStack>
          </YStack>
        </ScrollView>

        {/* Floating Submit Button */}
        <SubmitComponent
          onPress={handleGenerate}
          isLoading={isLoading}
          disabled={isLoading}
          title={t("inviteGenerateButton")}
        />
      </YStack>
    </View>
  );
}
