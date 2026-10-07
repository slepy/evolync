import { neutral } from "@/core/theme/tokens";
import type { LucideIcon } from "lucide-react-native";
import { Text, View, YStack } from "tamagui";

export interface EmptyStateProps {
  icon: LucideIcon;
  /** 22/800 ("No notifications yet"). */
  title: string;
  /** Muted line under the title: what shows up here. */
  text?: string;
}

/** Empty screen (N4): neutral 72px icon square, title and a muted line, centered. */
export function EmptyState({ icon: Icon, title, text }: EmptyStateProps) {
  return (
    <YStack alignItems="center" gap={14} paddingTop={128} paddingHorizontal={24}>
      <View
        width={72}
        height={72}
        borderRadius={24}
        backgroundColor="$neutralTintFill"
        alignItems="center"
        justifyContent="center"
      >
        <Icon size={32} color={neutral.tint} strokeWidth={2} />
      </View>
      <Text fontSize={22} fontWeight="$section" letterSpacing={-0.3} color="$neutralText" textAlign="center">
        {title}
      </Text>
      {text ? (
        <Text fontSize={14} fontWeight="$secondary" lineHeight={21} color="$neutralMuted" textAlign="center">
          {text}
        </Text>
      ) : null}
    </YStack>
  );
}
