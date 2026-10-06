import { neutral } from "@/core/theme/tokens";
import type { LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { Text, View, XStack, YStack } from "tamagui";

export interface SettingsCardProps {
  icon: LucideIcon;
  /** 18/800 ("Notifications", "Language"). */
  title: string;
  /** Muted line under the title ("This device only"). */
  subtitle?: string;
  /** The setting: a `Toggle` row, a `ChoiceList`… */
  children: ReactNode;
}

/** One group of account settings (17A): neutral icon, title and subtitle above the control. */
export function SettingsCard({ icon: Icon, title, subtitle, children }: SettingsCardProps) {
  return (
    <YStack
      gap={14}
      paddingVertical={18}
      paddingHorizontal={16}
      borderRadius="$card"
      borderWidth={1}
      borderColor="$neutralCardBorder"
      backgroundColor="$neutralCard"
    >
      <XStack alignItems="center" gap={12}>
        <View
          width={40}
          height={40}
          borderRadius={14}
          backgroundColor="$neutralTintFill"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
        >
          <Icon size={20} color={neutral.tint} strokeWidth={2} />
        </View>
        <YStack flex={1} minWidth={0} gap={2}>
          <Text fontSize={18} fontWeight="$section" color="$neutralText" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text fontSize={12.5} fontWeight="$secondary" color="$neutralMuted" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </YStack>
      </XStack>
      {children}
    </YStack>
  );
}
