import { ChevronRight, type LucideIcon } from "lucide-react-native";
import React from "react";
import { Text, View, XStack, YStack } from "tamagui";
import { resolveListAccent, type ListAccent } from "../List/accent";
import { statusSummaryBar } from "./statusSummaryBar";

export interface StatusSummaryItem {
  key: string;
  count: number;
  label: string;
  icon: LucideIcon;
  /** Bar segment color. */
  barColor: string;
  /** Legend icon color (Absent: lighter than its bar segment, for contrast). */
  iconColor: string;
}

export interface StatusSummaryProps {
  /** "19 members" */
  title: string;
  /** "15 coming" */
  subtitle?: string;
  /** Statuses in their fixed order (Paid, Attending, Absent…). */
  items: StatusSummaryItem[];
  /** Linked variant (details screen): the whole card opens the list. */
  onPress?: () => void;
  /** "Manage" — shown with a chevron in the accent tint on the linked variant. */
  actionLabel?: string;
  accent?: ListAccent;
}

/**
 * Status summary (board S §6, 10C / 10D): counts of people by status in one
 * card — header, a segmented bar sized by the counts, and a legend. Linked
 * on a details screen ("Manage ›", whole card pressable), static above the
 * list it summarizes.
 */
export function StatusSummary({ title, subtitle, items, onPress, actionLabel, accent = "neutral" }: StatusSummaryProps) {
  const tint = resolveListAccent(accent).tint;
  const segments = statusSummaryBar(items);

  return (
    <YStack
      role={onPress ? "button" : undefined}
      aria-label={onPress ? [title, actionLabel].filter(Boolean).join(", ") : undefined}
      onPress={onPress}
      pressStyle={onPress ? { opacity: 0.85 } : undefined}
      gap={14}
      padding={16}
      borderRadius="$card"
      backgroundColor="$neutralCard"
      borderWidth={1}
      borderColor="$neutralCardBorder"
    >
      <XStack alignItems="center" gap={12}>
        <YStack flex={1} minWidth={0} gap={2}>
          <Text fontSize="$rowTitle" fontWeight="$rowTitle" color="$neutralText" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text fontSize="$secondary" fontWeight="$secondary" color="$neutralMuted" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </YStack>
        {onPress && actionLabel ? (
          <XStack alignItems="center" gap={2} flexShrink={0}>
            <Text fontSize={14} fontWeight="$button" color={tint}>
              {actionLabel}
            </Text>
            <ChevronRight size={18} color={tint} strokeWidth={2.2} />
          </XStack>
        ) : null}
      </XStack>

      <XStack height={10} gap={3} borderRadius={5} backgroundColor={segments.length ? undefined : "$neutralCardBorder"}>
        {segments.map((s) => (
          <View
            key={s.key}
            flex={s.flex}
            backgroundColor={s.color}
            borderTopLeftRadius={s.radiusLeft}
            borderBottomLeftRadius={s.radiusLeft}
            borderTopRightRadius={s.radiusRight}
            borderBottomRightRadius={s.radiusRight}
          />
        ))}
      </XStack>

      <XStack alignItems="center" gap={16} flexWrap="wrap">
        {items.map(({ key, count, label, icon: Icon, iconColor }) => (
          <XStack key={key} alignItems="center" gap={6}>
            <Icon size={15} color={iconColor} strokeWidth={2.6} />
            <Text fontSize={13} fontWeight="$button" color="$neutralText">
              {count}
            </Text>
            <Text fontSize={13} fontWeight="600" color="$neutralMuted">
              {label}
            </Text>
          </XStack>
        ))}
      </XStack>
    </YStack>
  );
}
