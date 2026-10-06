import { contextColors, type ContextKey } from "@/core/theme/tokens";
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, Text, XStack, YStack } from "tamagui";
import { useBottomNavSpace } from "../BottomNav/BottomNav";
import { SyncedPill } from "../SyncedPill/SyncedPill";

export interface TabPageProps {
  /** 28/800 screen title ("Notifications", "Settings"). */
  title: string;
  /** Right of the Sync pill: 44px `IconButton`s ("Mark all as read"). */
  actions?: ReactNode;
  /** Context glow at the top of the page (N1 amber, N2 blue); Settings has none. */
  context?: ContextKey;
  /** Floating bottom nav (`MainNav`); the content keeps room for it. */
  nav?: ReactNode;
  /** Space between the sections (N1: 22, 17A: 16); the first one is always 22px under the title. */
  gap?: number;
  children: ReactNode;
}

/**
 * Screen of a bottom-nav tab other than Home (N1 Notifications, 17A
 * Settings): big title with the Sync pill and actions on the right, then
 * scrolling sections.
 */
export function TabPage({ title, actions, context, nav, gap = 22, children }: TabPageProps) {
  const navSpace = useBottomNavSpace();

  return (
    <YStack flex={1} backgroundColor="$neutralPage">
      {context ? (
        <LinearGradient
          colors={[contextColors[context].glow, "transparent"]}
          locations={[0, 1]}
          pointerEvents="none"
          style={{ position: "absolute", top: 0, left: 0, right: 0, height: 380 }}
        />
      ) : null}
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <XStack alignItems="center" gap={10} minHeight={44} paddingHorizontal={20} paddingTop={12}>
          <Text flex={1} fontSize="$title" fontWeight="$title" letterSpacing={-0.4} color="$neutralText" numberOfLines={1}>
            {title}
          </Text>
          <SyncedPill />
          {actions}
        </XStack>
        <ScrollView
          flex={1}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 22, paddingBottom: nav ? navSpace : 40 }}
        >
          <YStack width="100%" maxWidth={500} alignSelf="center" gap={gap}>
            {children}
          </YStack>
        </ScrollView>
      </SafeAreaView>
      {nav}
    </YStack>
  );
}
