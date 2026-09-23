import { supabase } from "@/config/supabase";
import { AppLogo } from "@/modules/core/components/AppLogo";
import { useStore } from "@/store";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spinner, Text, YStack } from "tamagui";

// Safe storage helper for web compatibility
const safeStorageSet = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === "web") {
    try {
      const AsyncStorage =
        require("@react-native-async-storage/async-storage").default;
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error("Storage set error:", error);
    }
  } else {
    const SecureStore = require("expo-secure-store");
    await SecureStore.setItemAsync(key, value);
  }
};

// ============================================================================
// AuthCallbackScreen Component
// ============================================================================

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { setUser, setSession, setError } = useStore();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const { access_token, refresh_token } = params;

        if (!access_token || !refresh_token) {
          setError({
            code: "unknown",
            message: t("errorInvalidOAuthCallback"),
            recoverable: true,
          });
          router.replace("/auth/login" as any);
          return;
        }

        // Set session in Supabase
        const { data, error } = await supabase.auth.setSession({
          access_token: access_token as string,
          refresh_token: refresh_token as string,
        });

        if (error || !data.session) {
          setError({
            code: "unknown",
            message: t("errorGoogleLoginFailed"),
            recoverable: true,
          });
          router.replace("/auth/login" as any);
          return;
        }

        // Save session to storage
        await safeStorageSet("session", JSON.stringify(data.session));

        // Update global state
        setUser(data.session.user);
        setSession(data.session);

        // Navigate to main screen
        router.replace("/");
      } catch (error) {
        console.error("OAuth callback error:", error);
        setError({
          code: "unknown",
          message: t("errorLoginError"),
          recoverable: true,
        });
        router.replace("/auth/login" as any);
      }
    };

    handleOAuthCallback();
  }, [params]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <YStack
        flex={1}
        alignItems="center"
        justifyContent="center"
        backgroundColor="$background"
        space="$4"
      >
        <AppLogo />
        <Spinner size="large" color="$blue11" />
        <Text color="$inkBlackLight" fontSize="$4">
          {t("finalizingLogin")}
        </Text>
      </YStack>
    </SafeAreaView>
  );
}
