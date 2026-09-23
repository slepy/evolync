import { useState } from "react";
import { useRouter } from "expo-router";
import { YStack, Text, Button, ScrollView } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAvoidingView, Platform, Alert, View } from "react-native";
import {
  Header,
  HeaderTitle,
  TextInput,
  SubmitButton,
  SubmitComponent,
  ErrorBanner,
} from "@/modules/core/components";
import { useJoinSchool } from "@/modules/school/hooks";
import { useAuth } from "@/modules/auth/hooks/useAuth";

export default function JoinSchoolScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { joinSchool, isLoading, error, reset } = useJoinSchool();
  const [schoolCode, setSchoolCode] = useState("");
  const insets = useSafeAreaInsets();

  const handleJoin = async () => {
    if (!schoolCode.trim()) return;

    // Validate user session
    if (!user || !user.email) {
      Alert.alert(t("error"), t("errorNoUser"));
      return;
    }

    const displayName = user.user_metadata?.full_name || user.email;
    const avatarUrl = user.user_metadata?.avatar_url as string | undefined;

    const ok = await joinSchool(
      schoolCode.trim().toUpperCase(),
      user.id,
      user.email,
      displayName,
      avatarUrl,
    );

    if (ok) {
      Alert.alert(t("success"), t("joinSchoolPending"), [
        {
          text: t("confirm"),
          onPress: () => router.replace("/user/dashboard"),
        },
      ]);
    }
    // If ok is false, error was set and will be displayed by ErrorBanner
  };

  const handleSkip = () => {
    router.replace("/user/dashboard");
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header
        onBack={() => router.back()}
        centerContent={<HeaderTitle text={t("joinSchool")} />}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            padding: 24,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <YStack
            flex={1}
            justifyContent="center"
            gap="$6"
            maxWidth={400}
            alignSelf="center"
            width="100%"
          >
            <YStack gap="$3" alignItems="center">
              <Text
                fontSize="$7"
                fontWeight="bold"
                color="$color"
                textAlign="center"
              >
                {t("enterSchoolCode")}
              </Text>
              <Text fontSize="$4" color="$gray11" textAlign="center">
                {t("enterSchoolCodeDescription")}
              </Text>
            </YStack>

            {error && (
              <ErrorBanner
                title={
                  error === "invalidSchoolCode"
                    ? t("invalidSchoolCode")
                    : error === "alreadySchoolMember"
                      ? t("alreadySchoolMember")
                      : error === "joinRequestPending"
                        ? t("joinRequestPending")
                        : t("error")
                }
                message={
                  error === "invalidSchoolCode"
                    ? t("invalidSchoolCodeMessage")
                    : error === "alreadySchoolMember"
                      ? t("alreadySchoolMemberMessage")
                      : error === "joinRequestPending"
                        ? t("joinRequestPendingMessage")
                        : t(error)
                }
                onDismiss={reset}
              />
            )}

            <TextInput
              label={t("schoolCode")}
              placeholder={t("schoolCodePlaceholder")}
              value={schoolCode}
              onChangeText={setSchoolCode}
              autoCapitalize="characters"
            />

            <SubmitComponent>
              <SubmitButton
                onPress={handleJoin}
                isLoading={isLoading}
                title={t("joinSchool")}
                disabled={!schoolCode.trim()}
              />
              <Button onPress={handleSkip} chromeless color="$gray11">
                {t("skipForNow")}
              </Button>
            </SubmitComponent>
          </YStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
