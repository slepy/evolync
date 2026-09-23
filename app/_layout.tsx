import "react-native-reanimated"; // Must be first
import "react-native-gesture-handler";
import "expo-dev-client";
import "react-native-get-random-values";
import "react-native-url-polyfill/auto";

import "@/core/i18n/config"; // Initialize i18n immediately
import { useSyncStore } from "@/database/hooks/useSyncStore";
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

  const [languageKey, setLanguageKey] = useState(i18n.language);
  useEffect(() => {
    const handler = (lng: string) => setLanguageKey(lng);
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
              key={languageKey}
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "#F8FAFC" },
              }}
            ></Stack>
          </View>
        </ThemeProvider>
      </TamaguiProvider>
    </PortalProvider>
  );
}
