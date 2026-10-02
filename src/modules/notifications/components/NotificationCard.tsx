import type Notification from "@/database/models/Notification";
import { BaseCard } from "@/modules/core/components";
import { formatDistanceToNow } from "date-fns";
import { enUS, pl } from "date-fns/locale";
import {
  Bell,
  CalendarCheck,
  CalendarPlus,
  CreditCard,
  ShoppingBag,
  UserPlus,
  type LucideIcon,
} from "lucide-react-native";
import React from "react";
import { Text, XStack, YStack } from "tamagui";
import { NOTIFICATION_TYPE } from "../types";
import { getNotificationContent } from "../utils";

const ICONS: Record<string, { icon: LucideIcon; color: string; background: string }> = {
  [NOTIFICATION_TYPE.ORDER_CREATED]: { icon: ShoppingBag, color: "$orange11", background: "$orange3" },
  [NOTIFICATION_TYPE.JOIN_REQUEST_CREATED]: { icon: UserPlus, color: "$blue11", background: "$blue3" },
  [NOTIFICATION_TYPE.EVENT_RSVP_ATTENDING]: { icon: CalendarCheck, color: "$green11", background: "$green3" },
  [NOTIFICATION_TYPE.PAYMENT_CREATED]: { icon: CreditCard, color: "$purple11", background: "$purple3" },
  [NOTIFICATION_TYPE.EVENT_ASSIGNED]: { icon: CalendarPlus, color: "$blue11", background: "$blue3" },
};

const FALLBACK_ICON = { icon: Bell, color: "$gray11", background: "$gray3" };

export interface NotificationCardProps {
  notification: Notification;
  onPress: (notification: Notification) => void;
}

export function NotificationCard({ notification, onPress }: NotificationCardProps) {
  const { title, body } = getNotificationContent(notification);
  const { icon: Icon, color, background } = ICONS[notification.type] ?? FALLBACK_ICON;
  const unread = !notification.readAt;
  const time = formatDistanceToNow(notification.createdAt, {
    addSuffix: true,
    locale: t("locale") === "pl" ? pl : enUS,
  });

  return (
    <BaseCard
      onPress={() => onPress(notification)}
      backgroundColor={unread ? "$blue2" : undefined}
      accessibilityLabel={`${title}. ${body}`}
    >
      <XStack gap="$3" alignItems="center" padding="$2">
        <YStack
          width={40}
          height={40}
          borderRadius={20}
          backgroundColor={background}
          alignItems="center"
          justifyContent="center"
        >
          <Icon size={20} color={color} />
        </YStack>

        <YStack flex={1} gap="$1">
          <Text fontSize="$4" fontWeight={unread ? "700" : "500"} color="$inkBlack">
            {title}
          </Text>
          <Text fontSize="$3" color="$gray11" numberOfLines={2}>
            {body}
          </Text>
          <Text fontSize="$2" color="$gray10">
            {time}
          </Text>
        </YStack>

        {unread && (
          <YStack
            width={10}
            height={10}
            borderRadius={5}
            backgroundColor="$blue10"
            accessibilityLabel={t("notificationsUnread")}
          />
        )}
      </XStack>
    </BaseCard>
  );
}
