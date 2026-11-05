import "react-native-reanimated"; // Must be first
import "react-native-gesture-handler";
import "expo-dev-client";
import "react-native-get-random-values";
import "react-native-url-polyfill/auto";

import "@/core/i18n/config"; // Initialize i18n immediately
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { registerSignOutHandler } from "@/core/utils/signOutBridge";
import { installCrashRecorder, showLastCrashReport } from "@/core/utils/diagnostics";
import { useSyncStore } from "@/database/hooks/useSyncStore";
import { LaunchScreen } from "@/core/components";
import { useLaunchUpdate } from "@/core/hooks";
import { NotificationResponseHandler } from "@/modules/notifications";
import { useOwnMembershipsWatcher } from "@/modules/school";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import {
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PortalProvider } from "@tamagui/portal";
import { TamaguiProvider } from "tamagui";
import i18n, { languageReady } from "@/core/i18n/config";
import config, { themeColors } from "../tamagui.config";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

// The app is dark-only: the navigation theme is the page color, never the OS scheme.
const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: themeColors.background,
    card: themeColors.surface,
    text: themeColors.textPrimary,
    border: themeColors.borderSubtle,
  },
};

export const unstable_settings = {
  initialRouteName: "index",
};

// A fatal JS error is saved and offered on the next launch (no logs in preview builds).
installCrashRecorder();

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // The stored language is applied before the first screen, so it never flashes in English.
  const [languageLoaded, setLanguageLoaded] = useState(false);
  useEffect(() => {
    languageReady.then(() => setLanguageLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded && languageLoaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded, languageLoaded]);

  // Cold-start update: a newer bundle downloads behind the launch screen and
  // the app reloads onto it before sync and navigation start.
  const updatePhase = useLaunchUpdate();

  if (!loaded || !languageLoaded) {
    return null;
  }

  if (updatePhase !== "done") {
    return <LaunchRoot updating={updatePhase === "updating"} />;
  }

  return <RootLayoutNav />;
}

/** The launch screen outside the navigator, while the launch update runs. */
function LaunchRoot({ updating }: { updating: boolean }) {
  return (
    <TamaguiProvider config={config} defaultTheme="dark">
      <StatusBar style="light" />
      <LaunchScreen updating={updating} />
    </TamaguiProvider>
  );
}

function RootLayoutNav() {
  useSyncStore({ autoSyncOnline: true, autoSyncOnForeground: true });
  useOwnMembershipsWatcher();

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

  useEffect(() => {
    showLastCrashReport().catch(console.error);
  }, []);

  // Gesture root for RNGH gestures (SwipeToDelete); outermost so portaled sheets are inside it too.
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PortalProvider shouldAddRootHost>
        <TamaguiProvider config={config} defaultTheme="dark">
          <ThemeProvider value={navigationTheme}>
            <StatusBar style="light" />
            <View
              style={{
                flex: 1,
                backgroundColor: themeColors.background,
              }}
            >
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: themeColors.background },
                }}
              >
                {/* Launch path (L2): screens that replace the launch loading
                  fade in instead of sliding over it. */}
                <Stack.Screen name="index" options={{ animation: "none" }} />
                <Stack.Screen name="auth/login" options={{ animation: "fade" }} />
                <Stack.Screen name="organization/dashboard" options={{ animation: "fade" }} />
                <Stack.Screen name="user/dashboard" options={{ animation: "fade" }} />
              </Stack>
              <NotificationResponseHandler />
            </View>
          </ThemeProvider>
        </TamaguiProvider>
      </PortalProvider>
    </GestureHandlerRootView>
  );
}
