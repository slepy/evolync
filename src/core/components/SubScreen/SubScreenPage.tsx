import { contextColors, type ContextKey } from "@/core/theme/tokens";
import { LinearGradient } from "expo-linear-gradient";
import { type ReactNode, useState } from "react";
import { KeyboardAwareScrollView, KeyboardStickyView } from "react-native-keyboard-controller";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack } from "tamagui";
import { bottomInsetPadding } from "../../utils/safeArea";
import { type SubScreenHeaderProps, SubScreenHeader } from "./SubScreenHeader";

/** Space kept between the focused input and the keyboard (or the footer riding on it). */
const KEYBOARD_GAP = 16;

export interface SubScreenPageProps extends SubScreenHeaderProps {
  children: ReactNode;
  /** Pinned under the scrolling content, above the keyboard (form screens: `PrimaryButton`). */
  footer?: ReactNode;
  /** Context glow at the top of the page (Calendar opened from a dashboard hero). */
  context?: ContextKey;
}

/**
 * Dark page with the sub-screen header and scrolling content, sections 24px
 * apart. With a `footer` it is a form screen (9B): the button stays visible.
 * The focused input scrolls above the keyboard and the footer rides on it, on
 * Android too (edge-to-edge never resizes the window).
 */
export function SubScreenPage({ children, footer, context, ...header }: SubScreenPageProps) {
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
        <YStack paddingHorizontal={20} paddingTop={12} paddingBottom={8}>
          <SubScreenHeader {...header} />
        </YStack>
        <KeyboardAwareScrollView
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          bottomOffset={footer ? footerHeight + KEYBOARD_GAP : KEYBOARD_GAP}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: footer ? 24 : bottomInsetPadding(40, insets.bottom) }}
        >
          <YStack width="100%" maxWidth={500} alignSelf="center" gap={24}>
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
    </YStack>
  );
}
