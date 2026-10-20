import { neutral } from "@/core/theme/tokens";
import { CalendarDays, Repeat } from "lucide-react-native";
import { Text, View, XStack, YStack } from "tamagui";
import { ListIcon } from "../List/ListIcon";
import { resolveListAccent } from "../List/accent";
import type { CalendarRow } from "./types";

export interface CalendarItemRowProps {
  row: CalendarRow;
}

export function CalendarItemRow({ row }: CalendarItemRowProps) {
  const badge = row.badge ? resolveListAccent(row.badge.accent) : null;

  return (
    <XStack
      role={row.onPress ? "button" : "listitem"}
      aria-label={row.badge ? `${row.title}, ${row.badge.label}` : row.title}
      onPress={row.onPress}
      pressStyle={row.onPress ? { opacity: 0.85 } : undefined}
      alignItems="center"
      gap={14}
      paddingVertical={14}
      paddingHorizontal={16}
    >
      <View opacity={row.cancelled ? 0.5 : 1}>
        <ListIcon icon={row.kind === "event" ? CalendarDays : Repeat} accent={row.kind === "event" ? "events" : "trainings"} />
      </View>
      <YStack flex={1} minWidth={0} gap={3}>
        <XStack alignItems="center" gap={8} minWidth={0}>
          <Text
            flexShrink={1}
            fontSize="$rowTitle"
            fontWeight="$rowTitle"
            color={row.cancelled ? neutral.placeholder : "$neutralText"}
            textDecorationLine={row.cancelled ? "line-through" : "none"}
            numberOfLines={1}
          >
            {row.title}
          </Text>
          {row.badge && badge ? (
            <View flexShrink={0} paddingVertical={2} paddingHorizontal={8} borderRadius="$chip" backgroundColor={badge.fill}>
              <Text fontSize={11} fontWeight="$button" color={badge.tint} numberOfLines={1}>
                {row.badge.label}
              </Text>
            </View>
          ) : null}
        </XStack>
        <Text fontSize="$secondary" fontWeight="$secondary" color="$neutralMuted" numberOfLines={1}>
          {row.meta}
        </Text>
      </YStack>
    </XStack>
  );
}
