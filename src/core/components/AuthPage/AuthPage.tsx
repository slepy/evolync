import { brand, contextColors, type ContextKey } from "@/core/theme/tokens";
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { LucideIcon } from "lucide-react-native";
import { ScrollView, Text, View, XStack, YStack } from "tamagui";
import { resolveListAccent, type ListAccent } from "../List/accent";
import { SubScreenHeader } from "../SubScreen/SubScreen";

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
}

/**
 * Page of the screens before a context exists (sign in, sign up, password
 * reset): dark page with the orange brand glow, optional back header,
 * content 18px apart, optional pinned footer button.
 */
export function AuthPage({ title, onBack, children, footer, bottom, context }: AuthPageProps) {
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
          <ScrollView
            flex={1}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 20,
              paddingTop: title ? 24 : 40,
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

export interface AuthPromptProps {
  /** Muted question ("No account yet?"). */
  text: string;
  /** Bold link ("Sign up"). */
  action: string;
  onPress: () => void;
}

/** "No account yet? Sign up" line: muted question, bold 44px-tall link. */
export function AuthPrompt({ text, action, onPress }: AuthPromptProps) {
  return (
    <XStack alignItems="center" justifyContent="center" gap={4}>
      <Text fontSize={14} fontWeight="600" color="$neutralMuted">
        {text}
      </Text>
      <XStack role="link" aria-label={action} onPress={onPress} pressStyle={{ opacity: 0.7 }} height={44} alignItems="center" paddingHorizontal={8}>
        <Text fontSize={14} fontWeight="$button" color="$neutralText">
          {action}
        </Text>
      </XStack>
    </XStack>
  );
}

export interface AuthIntroProps {
  title: string;
  description?: ReactNode;
  /** Optional 56px icon square above the title (`IntroIcon`; Join a school: ticket). */
  icon?: ReactNode;
  /** Icon, title and description centered, 10px apart (Join a school "Enter the school code"). */
  centered?: boolean;
}

/** 24/800 title with a muted 14/500 description (forgot password, new password, Join a school). */
export function AuthIntro({ title, description, icon, centered }: AuthIntroProps) {
  const align = centered ? "center" : undefined;
  return (
    <YStack gap={centered ? 10 : 18} alignItems={align} paddingHorizontal={centered ? 8 : 0} paddingTop={centered ? 4 : 0}>
      {icon}
      <YStack gap={centered ? 10 : 6} alignItems={align}>
        <Text fontSize={24} lineHeight={29} fontWeight="$section" letterSpacing={-0.4} color="$neutralText" textAlign={align}>
          {title}
        </Text>
        {description ? (
          <Text fontSize={14} lineHeight={21} fontWeight="$secondary" color="$neutralMuted" textAlign={align}>
            {description}
          </Text>
        ) : null}
      </YStack>
    </YStack>
  );
}

/** 56px icon square of an `AuthIntro`, 26px icon in the accent tint on its 16% fill. */
export function IntroIcon({ icon: Icon, accent = "neutral" }: { icon: LucideIcon; accent?: ListAccent }) {
  const a = resolveListAccent(accent);
  return (
    <View width={56} height={56} borderRadius={18} backgroundColor={a.fill} alignItems="center" justifyContent="center">
      <Icon size={26} color={a.tint} strokeWidth={2} />
    </View>
  );
}
