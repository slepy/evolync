import "react-native-reanimated"; // Must be first
import "react-native-gesture-handler";
import "expo-dev-client";
import "react-native-get-random-values";
import "react-native-url-polyfill/auto";

import "@/core/i18n/config"; // Initialize i18n immediately
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { registerSignOutHandler } from "@/modules/core/utils/signOutBridge";
import { useSyncStore } from "@/database/hooks/useSyncStore";
import { NotificationResponseHandler } from "@/modules/notifications";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { PortalProvider } from "@tamagui/portal";
import { TamaguiProvider } from "tamagui";
import i18n from "@/core/i18n/config";

import config from "../tamagui.config";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  initialRouteName: "index",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  useSyncStore({ autoSyncOnline: true, autoSyncOnForeground: true });

  // Register the real sign-out implementation for the shared Header component
  // to call via the core-owned bridge, so `core` never imports `auth` directly.
  const { signOut } = useAuth();
  useEffect(() => {
    registerSignOutHandler(signOut);
  }, [signOut]);

  // Force a re-render (not a remount) on language change so screens using the
  // non-reactive global t() pick up the new strings without losing navigation state.
  const [, forceLanguageRerender] = useState(i18n.language);
  useEffect(() => {
    const handler = (lng: string) => forceLanguageRerender(lng);
    i18n.on("languageChanged", handler);
    return () => i18n.off("languageChanged", handler);
  }, []);

  return (
    <PortalProvider shouldAddRootHost>
      <TamaguiProvider config={config} defaultTheme="light">
        <ThemeProvider value={DefaultTheme}>
          <View
            style={{
              flex: 1,
              backgroundColor: "#F8FAFC",
            }}
          >
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "#F8FAFC" },
              }}
            ></Stack>
            <NotificationResponseHandler />
          </View>
        </ThemeProvider>
      </TamaguiProvider>
    </PortalProvider>
  );
}
