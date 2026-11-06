import { contextColors, type ContextKey } from "@/core/theme/tokens";
import { LinearGradient } from "expo-linear-gradient";
import { type ReactNode, useState } from "react";
import { KeyboardAwareScrollView, KeyboardStickyView } from "react-native-keyboard-controller";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, XStack, YStack } from "tamagui";
import { bottomInsetPadding } from "../../utils/safeArea";
import { useBottomNavSpace } from "../BottomNav/BottomNav";
import { SyncedPill } from "../SyncedPill/SyncedPill";

/** Space kept between the focused input and the keyboard (or the footer riding on it). */
const KEYBOARD_GAP = 16;

export interface TabPageProps {
  /** 28/800 screen title ("Notifications", "Settings"). */
  title: string;
  /** Right of the Sync pill: 44px `IconButton`s ("Mark all as read"). */
  actions?: ReactNode;
  /** Context glow at the top of the page (N1 amber, N2 blue); Settings has none. */
  context?: ContextKey;
  /** Floating bottom nav (`MainNav`); the content keeps room for it. */
  nav?: ReactNode;
  /**
   * Pinned under the content, above the keyboard, in place of the nav (P2
   * Profile: Save after the first change). Pass either `nav` or `footer`.
   */
  footer?: ReactNode;
  /** Space between the sections (N1: 22, 17A: 16); the first one is always 22px under the title. */
  gap?: number;
  children: ReactNode;
}

/**
 * Screen of a bottom-nav tab other than Home (N1 Notifications, 17A
 * Settings): big title with the Sync pill and actions on the right, then
 * scrolling sections. The focused input scrolls above the keyboard and the
 * footer rides on it, on Android too (edge-to-edge never resizes the window).
 */
export function TabPage({ title, actions, context, nav, footer, gap = 22, children }: TabPageProps) {
  const navSpace = useBottomNavSpace();
  const insets = useSafeAreaInsets();
  const [footerHeight, setFooterHeight] = useState(0);

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
      <SafeAreaView style={{ flex: 1 }} edges={footer ? ["top", "bottom"] : ["top"]}>
        <XStack alignItems="center" gap={10} minHeight={44} paddingHorizontal={20} paddingTop={12}>
          <Text flex={1} fontSize="$title" fontWeight="$title" letterSpacing={-0.4} color="$neutralText" numberOfLines={1}>
            {title}
          </Text>
          <SyncedPill />
          {actions}
        </XStack>
        <KeyboardAwareScrollView
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          bottomOffset={footer ? footerHeight + KEYBOARD_GAP : KEYBOARD_GAP}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 22, paddingBottom: footer ? 24 : nav ? navSpace : bottomInsetPadding(40, insets.bottom) }}
        >
          <YStack width="100%" maxWidth={500} alignSelf="center" gap={gap}>
            {children}
          </YStack>
        </KeyboardAwareScrollView>
        {footer ? (
          // The footer sits on the bottom safe area; over the keyboard that gap is dropped.
          <KeyboardStickyView
            offset={{ closed: 0, opened: insets.bottom }}
            onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
          >
            <YStack paddingHorizontal={20} paddingTop={12} paddingBottom={12} backgroundColor="$neutralPage">
              <YStack width="100%" maxWidth={500} alignSelf="center">
                {footer}
              </YStack>
            </YStack>
          </KeyboardStickyView>
        ) : null}
      </SafeAreaView>
      {nav}
    </YStack>
  );
}
