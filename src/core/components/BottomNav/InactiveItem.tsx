import { neutral } from "@/core/theme/tokens";
import { Text, View, YStack } from "tamagui";
import type { BottomNavItem } from "./types";

export interface InactiveItemProps {
  item: BottomNavItem;
}

export function InactiveItem({ item }: InactiveItemProps) {
  const Icon = item.icon;

  return (
    <YStack
      role="tab"
      aria-selected={false}
      aria-label={item.label}
      onPress={item.onPress}
      pressStyle={{ opacity: 0.7 }}
      width={56}
      height={56}
      gap={4}
      alignItems="center"
      justifyContent="center"
    >
      <View>
        <Icon size={22} color={neutral.muted} strokeWidth={2.2} />
        {item.dot ? (
          <View
            position="absolute"
            top={-3}
            right={-4}
            width={11}
            height={11}
            borderRadius={6}
            borderWidth={2}
            borderColor="$neutralRaised"
            backgroundColor="$alertDot"
          />
        ) : null}
      </View>
      <Text fontSize={11} fontWeight="700" color="$neutralMuted" numberOfLines={1}>
        {item.label}
      </Text>
    </YStack>
  );
}
