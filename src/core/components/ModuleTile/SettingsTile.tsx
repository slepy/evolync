import { neutral } from "@/core/theme/tokens";
import { useRouter, type Href } from "expo-router";
import type { LucideIcon } from "lucide-react-native";
import { Text, View, XStack, YStack } from "tamagui";

export interface SettingsTileProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  /** Route opened when the row is pressed. */
  href: Href;
}

/**
 * Wide tile (board S, 2A "School settings"): a full-width row below the
 * module grid for chrome that belongs to no module, so it is neutral gray,
 * never a module color. No chevron, the whole row is the link.
 */
export function SettingsTile({ icon: Icon, title, subtitle, href }: SettingsTileProps) {
  const router = useRouter();

  return (
    <XStack
      role="button"
      aria-label={title}
      onPress={() => router.push(href)}
      pressStyle={{ opacity: 0.85 }}
      alignItems="center"
      gap={14}
      paddingVertical={14}
      paddingHorizontal={16}
      borderRadius="$card"
      borderWidth={1}
      borderColor="$neutralCardBorder"
      backgroundColor="$neutralCard"
    >
      <View
        width={44}
        height={44}
        borderRadius="$tileIcon"
        backgroundColor="$neutralTintFill"
        alignItems="center"
        justifyContent="center"
      >
        <Icon size={22} color={neutral.tint} strokeWidth={2} />
      </View>
      <YStack flex={1} minWidth={0} gap={3}>
        <Text fontSize={16} fontWeight="800" color="$neutralText" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text fontSize="$secondary" fontWeight="$secondary" color="$neutralMuted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </YStack>
    </XStack>
  );
}
