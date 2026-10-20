import { contextColors, type ContextKey } from "@/core/theme/tokens";
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, YStack } from "tamagui";
import { type SubScreenHeaderProps, SubScreenHeader } from "./SubScreenHeader";

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
 */
export function SubScreenPage({ children, footer, context, ...header }: SubScreenPageProps) {
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
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <YStack paddingHorizontal={20} paddingTop={12} paddingBottom={8}>
            <SubScreenHeader {...header} />
          </YStack>
          <ScrollView
            flex={1}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: footer ? 24 : 40 }}
          >
            <YStack width="100%" maxWidth={500} alignSelf="center" gap={24}>
              {children}
            </YStack>
          </ScrollView>
          {footer ? (
            <YStack paddingHorizontal={20} paddingTop={12} paddingBottom={12}>
              <YStack width="100%" maxWidth={500} alignSelf="center">
                {footer}
              </YStack>
            </YStack>
          ) : null}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </YStack>
  );
}
