import { contextColors, type ContextKey } from "@/core/theme/tokens";
import { MapPin } from "lucide-react-native";
import { Text, View, XStack, YStack } from "tamagui";
import type { NextUpItem } from "./pickNextUp";

export interface NextUpRowProps {
  context: ContextKey;
  item: NextUpItem;
  onPress?: () => void;
}

export function NextUpRow({
  context,
  item,
  onPress,
}: NextUpRowProps) {
  const c = contextColors[context];
  const isEvent = item.kind === "event";

  return (
    <XStack
      role={onPress ? "button" : undefined}
      onPress={onPress}
      pressStyle={onPress ? { opacity: 0.85 } : undefined}
      alignItems="stretch"
      gap={12}
      paddingVertical={12}
      paddingHorizontal={14}
      borderRadius="$headerRow"
      backgroundColor={c.rowBg}
    >
      <YStack gap={4} flex={1} minWidth={0}>
        {isEvent ? (
          <View alignSelf="flex-start" paddingHorizontal={8} paddingVertical={2} borderRadius="$chip" backgroundColor={c.chipBg}>
            <Text fontSize="$chip" fontWeight="$chip" letterSpacing="$chip" color={c.chipFg}>
              {t("nextUpChipEvent")}
            </Text>
          </View>
        ) : (
          <View alignSelf="flex-start" paddingHorizontal={8} borderRadius="$chip" borderWidth={1.5} borderColor={c.fg}>
            <Text fontSize="$chip" fontWeight="$chip" letterSpacing="$chip" lineHeight={17} color={c.fg}>
              {t("nextUpChipTraining")}
            </Text>
          </View>
        )}
        <Text fontSize="$tileTitle" fontWeight="$tileTitle" lineHeight={20} color={c.fg} numberOfLines={2}>
          {item.title}
        </Text>
        {item.place ? (
          <XStack alignItems="center" gap={6}>
            <MapPin size={14} color={c.fgSoft} strokeWidth={2.2} />
            <Text fontSize="$secondary" fontWeight="700" color={c.fgSoft} numberOfLines={1} flexShrink={1}>
              {item.place}
            </Text>
          </XStack>
        ) : null}
      </YStack>
      {item.kind === "training" ? (
        <YStack justifyContent="center" gap={2} width={60} flexShrink={0}>
          <Text fontSize="$tileTitle" fontWeight="$tileTitle" color={c.fg}>
            {item.startTime}
          </Text>
          <Text fontSize={12} fontWeight="700" color={c.fgSoft}>
            {item.endTime}
          </Text>
        </YStack>
      ) : null}
    </XStack>
  );
}
