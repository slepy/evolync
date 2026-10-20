import { brand, contextColors, type ContextKey } from "@/core/theme/tokens";
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, XStack, YStack } from "tamagui";
import { SubScreenHeader } from "../SubScreen/SubScreenHeader";

export interface AuthPageProps {
  /** Header title with a back button ("Sign up"); none on the sign in screen. */
  title?: string;
  /** Default: router.back(). */
  onBack?: () => void;
  children: ReactNode;
  /** Pinned under the content, above the keyboard (form screens: `PrimaryButton`). */
  footer?: ReactNode;
  /** Pushed to the bottom of the page ("No account yet? Sign up"). */
  bottom?: ReactNode;
  /** Glow of a context instead of the brand one (Join a school "Request sent": school red). */
  context?: ContextKey;
  /** Top right corner of a screen without a back header (sign in: `LanguagePicker`). */
  corner?: ReactNode;
}

/**
 * Page of the screens before a context exists (sign in, sign up, password
 * reset): dark page with the orange brand glow, optional back header,
 * content 18px apart, optional pinned footer button.
 */
export function AuthPage({ title, onBack, children, footer, bottom, context, corner }: AuthPageProps) {
  return (
    <YStack flex={1} backgroundColor="$neutralPage">
      <LinearGradient
        colors={[context ? contextColors[context].glow : brand.glow, "transparent"]}
        locations={[0, 1]}
        pointerEvents="none"
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 340 }}
      />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          {title ? (
            <YStack paddingHorizontal={20} paddingTop={12}>
              <YStack width="100%" maxWidth={500} alignSelf="center">
                <SubScreenHeader title={title} onBack={onBack} right={false} />
              </YStack>
            </YStack>
          ) : null}
          {corner && !title ? (
            <XStack paddingHorizontal={20} paddingTop={12} justifyContent="flex-end">
              <XStack width="100%" maxWidth={500} alignSelf="center" justifyContent="flex-end">
                {corner}
              </XStack>
            </XStack>
          ) : null}
          <ScrollView
            flex={1}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 20,
              paddingTop: title ? 24 : corner ? 10 : 40,
              paddingBottom: footer ? 16 : 8,
            }}
          >
            <YStack flex={1} width="100%" maxWidth={500} alignSelf="center" gap={18}>
              {children}
              {bottom ? (
                <YStack flex={1} justifyContent="flex-end">
                  {bottom}
                </YStack>
              ) : null}
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
