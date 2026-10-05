import { contextColors, neutral, type ContextKey } from "@/core/theme/tokens";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, Text, View, XStack, YStack } from "tamagui";
import { SyncedPill } from "../SyncedPill/SyncedPill";

export interface SubScreenHeaderProps {
  title: string;
  /** Muted line under the title (Calendar: "All schools · events and trainings"). */
  subtitle?: string;
  /** Default: router.back(). */
  onBack?: () => void;
  /** Right side; default the Sync pill. */
  right?: ReactNode;
}

/**
 * Header of a screen opened from a dashboard (7A, 8A, 9A): back chevron,
 * title, Sync pill on the right.
 */
export function SubScreenHeader({ title, subtitle, onBack, right }: SubScreenHeaderProps) {
  const router = useRouter();

  return (
    <XStack alignItems="center" gap={12} minHeight={44}>
      <View
        role="button"
        aria-label={t("back")}
        onPress={onBack ?? (() => router.back())}
        pressStyle={{ opacity: 0.8 }}
        width={44}
        height={44}
        borderRadius={22}
        borderWidth={1}
        borderColor="$neutralRaisedBorder"
        backgroundColor="$neutralCard"
        alignItems="center"
        justifyContent="center"
        flexShrink={0}
      >
        <ChevronLeft size={22} color={neutral.text} strokeWidth={2.2} />
      </View>
      <YStack flex={1} minWidth={0} gap={1}>
        <Text fontSize={22} fontWeight="$section" letterSpacing={-0.3} color="$neutralText" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text fontSize={12.5} fontWeight="700" color="$neutralMuted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </YStack>
      {right ?? <SyncedPill />}
    </XStack>
  );
}

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
