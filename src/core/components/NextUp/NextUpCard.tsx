import { contextColors, type ContextKey } from "@/core/theme/tokens";
import { LinearGradient } from "expo-linear-gradient";
import { CalendarDays } from "lucide-react-native";
import { StyleSheet } from "react-native";
import { Spinner, Text, View, XStack, YStack } from "tamagui";
import type { NextUpItem } from "./pickNextUp";
import { NextUpRow } from "./NextUpRow";

export interface NextUpCardProps {
  /** Organization = amber, School = red, Student = blue. */
  context: ContextKey;
  /** Small uppercase line above the title (e.g. "NEXT UP"). */
  eyebrow?: string;
  title: string;
  items?: NextUpItem[];
  /** Shown instead of rows when there are no items. */
  emptyText?: string;
  isLoading?: boolean;
  onCalendarPress?: () => void;
  onItemPress?: (item: NextUpItem) => void;
}

/**
 * Header box (board S, 1A / 2A / 4 / 1C): context gradient, eyebrow +
 * title with a calendar shortcut, then event / training rows. Presentational
 * only — NextUp feeds it from the database.
 */
export function NextUpCard({
  context,
  eyebrow,
  title,
  items = [],
  emptyText,
  isLoading,
  onCalendarPress,
  onItemPress,
}: NextUpCardProps) {
  const c = contextColors[context];

  return (
    <YStack position="relative" overflow="hidden" borderRadius="$header" padding={22} gap={18}>
      <LinearGradient
        colors={c.gradient.map((stop) => stop.color) as [string, string, ...string[]]}
        locations={c.gradient.map((stop) => stop.at) as [number, number, ...number[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View
        position="absolute"
        right={-50}
        top={-60}
        width={190}
        height={190}
        borderRadius={95}
        borderWidth={1.5}
        borderColor={c.ring}
      />
      <View
        position="absolute"
        right={-10}
        top={-20}
        width={110}
        height={110}
        borderRadius={55}
        borderWidth={1.5}
        borderColor={c.ring}
      />

      <XStack alignItems="center" justifyContent="space-between" gap={12}>
        <YStack gap={3} flexShrink={1}>
          {eyebrow ? (
            <Text
              fontSize="$eyebrow"
              fontWeight="$eyebrow"
              letterSpacing={0.9}
              textTransform="uppercase"
              color={c.fgSoft}
            >
              {eyebrow}
            </Text>
          ) : null}
          <Text
            fontSize="$headerTitle"
            fontWeight="$headerTitle"
            letterSpacing="$headerTitle"
            color={c.fg}
            numberOfLines={1}
          >
            {title}
          </Text>
        </YStack>
        {onCalendarPress ? (
          <View
            role="button"
            aria-label={t("nextUpOpenCalendar")}
            onPress={onCalendarPress}
            width={46}
            height={46}
            borderRadius={23}
            backgroundColor={c.iconButton}
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
            pressStyle={{ opacity: 0.8 }}
          >
            <CalendarDays size={22} color={c.fg} strokeWidth={2.2} />
          </View>
        ) : null}
      </XStack>

      {isLoading ? (
        <Spinner color={c.fg} />
      ) : items.length > 0 ? (
        <YStack gap={10}>
          {items.map((item) => (
            <NextUpRow
              key={`${item.kind}:${item.id}`}
              context={context}
              item={item}
              onPress={onItemPress ? () => onItemPress(item) : undefined}
            />
          ))}
        </YStack>
      ) : emptyText ? (
        <Text fontSize="$secondary" fontWeight="$button" color={c.fgSoft}>
          {emptyText}
        </Text>
      ) : null}
    </YStack>
  );
}
