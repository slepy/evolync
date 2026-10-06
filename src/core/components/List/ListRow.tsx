import { neutral } from "@/core/theme/tokens";
import type { LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { Text, XStack, YStack } from "tamagui";
import { resolveListAccent, type ListAccent } from "./accent";

export type ListRowSize = "lg" | "md";

export interface ListRowProps {
  title: string;
  /** Small tag right after the title (14A "CURRENT"). */
  badge?: ReactNode;
  /** One muted line under the title (school, email, "3 of 12 paid"). */
  subtitle?: string;
  /** Chips under the title (stock / price per currency); replaces the subtitle line. */
  meta?: ReactNode;
  /** 13px icon in front of the subtitle (map pin, calendar…). */
  subtitleIcon?: LucideIcon;
  /** Left slot: `ListIcon`, `ListAvatar`, a belt ring… */
  leading?: ReactNode;
  /** Right slot: `ListChip`, `ListCheckbox`, `ListCheck`, an amount, row actions… */
  trailing?: ReactNode;
  onPress?: () => void;
  /**
   * "lg" (default): navigation lists, 48px icon, title 16/800.
   * "md": pickers and form lists, 64px row, 44px avatar, title 15/800.
   */
  size?: ListRowSize;
  /** Selected sheet row: 8% accent background. */
  selected?: boolean;
  /** Destructive action row (16G Archive): title in the trash red. */
  danger?: boolean;
  accent?: ListAccent;
  /** Content shown under the row while `expanded` (12F sizes + quantity). */
  children?: ReactNode;
  expanded?: boolean;
  role?: "button" | "link" | "checkbox" | "option" | "radio" | "listitem";
  "aria-label"?: string;
  "aria-checked"?: boolean;
  "aria-selected"?: boolean;
}

/**
 * One row of a `ListCard`. No chevron and no own card: the whole row is the
 * tap target and the right edge stays free for data.
 */
export function ListRow({
  title,
  badge,
  subtitle,
  subtitleIcon: SubtitleIcon,
  meta,
  leading,
  trailing,
  onPress,
  size = "lg",
  selected,
  danger,
  accent = "neutral",
  children,
  expanded,
  role,
  ...aria
}: ListRowProps) {
  const lg = size === "lg";
  const expandable = children !== undefined;

  return (
    <YStack backgroundColor={selected ? resolveListAccent(accent).selectedFill : "transparent"}>
      <XStack
        role={role ?? (onPress ? "button" : undefined)}
        aria-label={aria["aria-label"] ?? title}
        aria-checked={aria["aria-checked"]}
        aria-selected={aria["aria-selected"] ?? selected}
        aria-expanded={expandable ? !!expanded : undefined}
        onPress={onPress}
        pressStyle={onPress ? { opacity: 0.85 } : undefined}
        alignItems="center"
        gap={lg ? 14 : 12}
        minHeight={lg ? undefined : 64}
        paddingVertical={lg ? 14 : 10}
        paddingHorizontal={16}
      >
        {leading}

        <YStack flex={1} minWidth={0} gap={lg ? 3 : 2}>
          <XStack alignItems="center" gap={8}>
            <Text
              flexShrink={1}
              fontSize={lg ? "$rowTitle" : 15}
              fontWeight="$rowTitle"
              color={danger ? "$trashText" : "$neutralText"}
              numberOfLines={1}
            >
              {title}
            </Text>
            {badge}
          </XStack>
          {subtitle ? (
            <XStack alignItems="center" gap={5}>
              {SubtitleIcon ? <SubtitleIcon size={13} color={neutral.muted} strokeWidth={2} /> : null}
              <Text
                flexShrink={1}
                fontSize={lg ? "$secondary" : 12.5}
                fontWeight="$secondary"
                color="$neutralMuted"
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            </XStack>
          ) : null}
          {meta ? (
            <XStack flexWrap="wrap" gap={6} marginTop={3}>
              {meta}
            </XStack>
          ) : null}
        </YStack>

        {trailing}
      </XStack>

      {expandable && expanded ? (
        <YStack paddingHorizontal={16} paddingBottom={14}>
          {children}
        </YStack>
      ) : null}
    </YStack>
  );
}
