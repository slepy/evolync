import { contextColors, type ContextKey } from "@/core/theme/tokens";
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, XStack, YStack } from "tamagui";
import { useBottomNavSpace } from "../BottomNav/BottomNav";
import { ContextSwitcher } from "../ContextSwitcher/ContextSwitcher";

export interface DashboardPageProps {
  /** Organization = amber, School = red, Student = blue: the glow at the top of the page. */
  context: ContextKey;
  /** Usually a `DashboardHeader`. Sits above the scroll content. */
  header: ReactNode;
  /** Shown between the header and the content (prompts, banners). */
  banner?: ReactNode;
  /** Floating bottom nav (`MainNav`); the content keeps room for it. */
  nav?: ReactNode;
  children: ReactNode;
}

/**
 * Main-screen layout of a context dashboard (1A / 2A / 4): dark page with the
 * context glow on top, header row, then sections 24px apart.
 */
export function DashboardPage({ context, header, banner, nav, children }: DashboardPageProps) {
  const navSpace = useBottomNavSpace();

  return (
    <YStack flex={1} backgroundColor="$neutralPage">
      <LinearGradient
        colors={[contextColors[context].glow, "transparent"]}
        locations={[0, 1]}
        pointerEvents="none"
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 380 }}
      />
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <YStack paddingHorizontal={20} paddingTop={12} paddingBottom={8}>
          {header}
        </YStack>
        {banner}
        <ScrollView flex={1} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: nav ? navSpace : 40 }}>
          <YStack width="100%" maxWidth={500} alignSelf="center" gap={24}>
            {children}
          </YStack>
        </ScrollView>
      </SafeAreaView>
      {nav}
    </YStack>
  );
}

export interface DashboardHeaderProps {
  /** Organization (1A), School, Student (4): colors the switcher. */
  context: ContextKey;
  /** Organization / school name shown in the switcher. */
  title: string;
  /** Opens the context sheet; without it the switcher is a static label. */
  onSwitchPress?: () => void;
  switchLabel?: string;
  /** Right side, usually `<SyncedPill />`. */
  right?: ReactNode;
}

/** Top row of a dashboard: context switcher on the left, Synced pill (and friends) on the right. */
export function DashboardHeader({ context, title, onSwitchPress, switchLabel, right }: DashboardHeaderProps) {
  return (
    <XStack alignItems="center" justifyContent="space-between" gap={12} minHeight={44}>
      <ContextSwitcher context={context} title={title} onPress={onSwitchPress} label={switchLabel} />
      {right ? (
        <XStack alignItems="center" gap={8} flexShrink={0}>
          {right}
        </XStack>
      ) : null}
    </XStack>
  );
}
