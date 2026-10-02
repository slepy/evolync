import { useStore } from "@/store";
import { useRouter } from "expo-router";
import { Bell } from "lucide-react-native";
import React from "react";
import { TouchableOpacity } from "react-native";
import { Text, useTheme, YStack } from "tamagui";
import { useUnreadNotificationCount } from "../hooks";
import { formatUnreadBadge } from "../utils";

/**
 * Header bell with the unread notification count. Opens the inbox.
 * Reads from WatermelonDB only, so it works offline.
 */
export function NotificationBell() {
  const router = useRouter();
  const theme = useTheme();
  const userId = useStore((s) => s.user?.id);
  const unread = useUnreadNotificationCount(userId);
  const badge = formatUnreadBadge(unread);

  return (
    <TouchableOpacity
      onPress={() => router.push("/notifications" as any)}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityRole="button"
      accessibilityLabel={
        badge ? t("notificationsBellUnread", { count: unread }) : t("notificationsTitle")
      }
      style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
    >
      <YStack pointerEvents="none">
        <Bell size={24} color={theme.inkBlack?.val} />
        {badge && (
          <YStack
            position="absolute"
            top={-6}
            right={-8}
            minWidth={18}
            height={18}
            paddingHorizontal={4}
            borderRadius={9}
            backgroundColor="$red10"
            alignItems="center"
            justifyContent="center"
          >
            <Text color="white" fontSize={11} fontWeight="700" lineHeight={14}>
              {badge}
            </Text>
          </YStack>
        )}
      </YStack>
    </TouchableOpacity>
  );
}
