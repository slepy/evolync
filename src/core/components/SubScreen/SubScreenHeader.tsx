import { neutral } from "@/core/theme/tokens";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import type { ReactNode } from "react";
import { Text, View, XStack, YStack } from "tamagui";
import { SyncedPill } from "../SyncedPill/SyncedPill";

export interface SubScreenHeaderProps {
  title: string;
  /** Muted line under the title (Calendar: "All schools · events and trainings"). */
  subtitle?: string;
  /** Default: router.back(). */
  onBack?: () => void;
  /** Right side; default the Sync pill. */
  right?: ReactNode;
  /** 18px title for a header over a 3D scene (D8 editor: sequence title over "Step 2 of 6"). */
  compact?: boolean;
}

/**
 * Header of a screen opened from a dashboard (7A, 8A, 9A): back chevron,
 * title, Sync pill on the right.
 */
export function SubScreenHeader({ title, subtitle, onBack, right, compact }: SubScreenHeaderProps) {
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
        <Text
          fontSize={compact ? 18 : 22}
          fontWeight="$section"
          letterSpacing={compact ? 0 : -0.3}
          color="$neutralText"
          numberOfLines={1}
        >
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
