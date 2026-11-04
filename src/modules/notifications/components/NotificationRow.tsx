import { ListIcon, ListUnreadDot, type ListAccent } from "@/core/components";
import type { LucideIcon } from "lucide-react-native";
import { Text, XStack, YStack } from "tamagui";

export interface NotificationRowProps {
  title: string;
  body: string;
  /** "12 min", "18:40", "12 Nov". */
  time: string;
  unread: boolean;
  /** `notificationRowStyle(type)`: module icon and color. */
  icon: LucideIcon;
  accent: ListAccent;
  onPress: () => void;
  /** Screen-reader "Delete" action (the swipe is not reachable by VoiceOver / TalkBack). */
  onDelete?: () => void;
}

/**
 * Inbox row (N1 / N2): module-tinted icon, title with the unread dot and the
 * time on the right, body wrapping under it. Unread rows are bold white on a
 * 3% white fill; read titles are softer.
 */
export function NotificationRow({ title, body, time, unread, icon, accent, onPress, onDelete }: NotificationRowProps) {
  return (
    <XStack
      role="button"
      aria-label={[title, body, time, unread ? t("notificationsUnread") : null].filter(Boolean).join(". ")}
      onPress={onPress}
      accessibilityActions={onDelete ? [{ name: "delete", label: t("delete") }] : undefined}
      onAccessibilityAction={
        onDelete
          ? (event: { nativeEvent: { actionName: string } }) => {
              if (event.nativeEvent.actionName === "delete") onDelete();
            }
          : undefined
      }
      pressStyle={{ opacity: 0.85 }}
      alignItems="flex-start"
      gap={14}
      paddingVertical={14}
      paddingHorizontal={16}
      backgroundColor={unread ? "$neutralUnreadRow" : "transparent"}
    >
      <ListIcon icon={icon} accent={accent} />
      <YStack flex={1} minWidth={0} gap={3} paddingTop={2}>
        <XStack alignItems="center" gap={8}>
          <Text
            flex={1}
            fontSize="$rowTitle"
            fontWeight={unread ? "$rowTitle" : "700"}
            color={unread ? "$neutralText" : "$neutralTint"}
            numberOfLines={1}
          >
            {title}
          </Text>
          {unread ? <ListUnreadDot /> : null}
          <Text fontSize={12.5} fontWeight="700" color="$neutralMuted" numberOfLines={1} flexShrink={0}>
            {time}
          </Text>
        </XStack>
        <Text fontSize={13.5} fontWeight="$secondary" lineHeight={19} color="$neutralMuted">
          {body}
        </Text>
      </YStack>
    </XStack>
  );
}
