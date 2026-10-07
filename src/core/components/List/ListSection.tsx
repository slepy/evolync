import { Plus, type LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { Text, View, XStack, YStack } from "tamagui";
import { resolveListAccent, type ListAccent } from "./accent";
import { ListChip } from "./ListParts";

export interface ListSectionAction {
  /** "Add new", "Mark all as read", "Copy"… */
  label: string;
  onPress: () => void;
  /** Default: plus. */
  icon?: LucideIcon;
}

export interface ListSectionProps {
  title: string;
  /** Muted line under a "section" title (Calendar: "3 items"). */
  subtitle?: string;
  /**
   * "section" (default): 20/800 screen section title ("Your schools").
   * "label": 12/800 uppercase field / group label ("SELECT MEMBERS", "TODAY", "MARCH").
   */
  variant?: "section" | "label";
  /** Colors the action pill and the chip. */
  accent?: ListAccent;
  /** Pill button on the right of the header. */
  action?: ListSectionAction;
  /** 44px round icon button in front of the pill (16A: new invite code). */
  iconAction?: ListSectionAction & { icon: LucideIcon };
  /** Chip on the right of the header ("3 selected", "86%"). */
  chip?: string;
  /** Usually a `ListCard`; anything between header and card (search, summary) goes here too. */
  children: ReactNode;
}

/** Header (title + optional action pill or chip) above a list card. */
export function ListSection({
  title,
  subtitle,
  variant = "section",
  accent = "neutral",
  action,
  iconAction,
  chip,
  children,
}: ListSectionProps) {
  const section = variant === "section";

  return (
    <YStack gap={section ? 14 : 10}>
      <XStack alignItems="center" justifyContent="space-between" gap={12} minHeight={section ? 40 : undefined}>
        {section ? (
          <YStack flexShrink={1} minWidth={0} gap={2}>
            <Text fontSize="$section" fontWeight="$section" letterSpacing={-0.2} color="$neutralText" numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text fontSize={13} fontWeight="600" color="$neutralMuted" numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </YStack>
        ) : (
          <Text fontSize={12} fontWeight="$eyebrow" letterSpacing={0.8} textTransform="uppercase" color="$neutralMuted" flexShrink={1} numberOfLines={1}>
            {title}
          </Text>
        )}
        {action || iconAction ? (
          <XStack alignItems="center" gap={8} flexShrink={0}>
            {iconAction ? <SectionIconButton action={iconAction} accent={accent} /> : null}
            {action ? <SectionActionPill action={action} accent={accent} /> : null}
          </XStack>
        ) : null}
        {chip ? <ListChip label={chip} accent={accent} /> : null}
      </XStack>
      {children}
    </YStack>
  );
}

function SectionIconButton({ action, accent }: { action: ListSectionAction & { icon: LucideIcon }; accent: ListAccent }) {
  const a = resolveListAccent(accent);
  const Icon = action.icon;

  return (
    <View
      role="button"
      aria-label={action.label}
      onPress={action.onPress}
      pressStyle={{ opacity: 0.8 }}
      width={44}
      height={44}
      borderRadius={22}
      backgroundColor={a.fill}
      alignItems="center"
      justifyContent="center"
    >
      <Icon size={20} color={a.tint} strokeWidth={2.2} />
    </View>
  );
}

function SectionActionPill({ action, accent }: { action: ListSectionAction; accent: ListAccent }) {
  const a = resolveListAccent(accent);
  const Icon = action.icon ?? Plus;

  return (
    <XStack
      role="button"
      aria-label={action.label}
      onPress={action.onPress}
      pressStyle={{ opacity: 0.8 }}
      alignItems="center"
      gap={6}
      height={40}
      paddingLeft={12}
      paddingRight={16}
      borderRadius="$pill"
      backgroundColor={a.fill}
    >
      <Icon size={16} color={a.label} strokeWidth={2.8} />
      <Text fontSize="$button" fontWeight="$button" color={a.label}>
        {action.label}
      </Text>
    </XStack>
  );
}
