import { useBottomNavSpace } from "@/core/components";
import type Notification from "@/database/models/Notification";
import { Header, HeaderTitle } from "@/modules/core/components";
import { useStore } from "@/store";
import { useRouter } from "expo-router";
import { BellOff, CheckCheck } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, useTheme, YStack } from "tamagui";
import { useNotifications } from "../hooks";
import {
  markAllNotificationsRead,
  markNotificationRead,
  resolveNotificationOpen,
} from "../services";
import { NotificationCard } from "./NotificationCard";

const UNAVAILABLE_TOAST_MS = 2500;

/**
 * Inbox shared by owners and students. Reads from WatermelonDB, so it renders
 * offline; marking read is local-first and syncs in the background.
 */
export function NotificationsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navSpace = useBottomNavSpace();
  const userId = useStore((s) => s.user?.id);
  const notifications = useNotifications(userId);
  const hasUnread = notifications.some((n) => !n.readAt);

  const [unavailableVisible, setUnavailableVisible] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const showUnavailable = useCallback(() => {
    setUnavailableVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setUnavailableVisible(false), UNAVAILABLE_TOAST_MS);
  }, []);

  const handlePress = useCallback(
    async (notification: Notification) => {
      markNotificationRead(notification.id).catch((err) =>
        console.error("[NotificationsScreen] markRead:", err),
      );

      const result = await resolveNotificationOpen(notification);
      if (result.status === "navigate") {
        router.push(result.route as any);
      } else if (result.status === "unavailable") {
        showUnavailable();
      }
    },
    [router, showUnavailable],
  );

  const handleMarkAllRead = useCallback(() => {
    if (!userId) return;
    markAllNotificationsRead(userId).catch((err) =>
      console.error("[NotificationsScreen] markAllRead:", err),
    );
  }, [userId]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/" as any);
  }, [router]);

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header
        onBack={handleBack}
        centerContent={<HeaderTitle text={t("notificationsTitle")} />}
        rightContent={
          hasUnread ? (
            <TouchableOpacity
              onPress={handleMarkAllRead}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={t("notificationsMarkAllRead")}
              style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
            >
              <CheckCheck size={24} color={theme.textPrimary?.val} />
            </TouchableOpacity>
          ) : undefined
        }
        showLogoMenu={false}
      />

      {unavailableVisible && (
        <YStack
          marginHorizontal="$3"
          marginTop="$2"
          padding="$3"
          borderRadius="$3"
          backgroundColor="$yellow3"
          borderWidth={1}
          borderColor="$yellow7"
        >
          <Text fontSize="$3" color="$yellow11">
            {t("notificationsUnavailable")}
          </Text>
        </YStack>
      )}

      {notifications.length === 0 ? (
        <YStack flex={1} padding="$6" gap="$3" alignItems="center" justifyContent="center">
          <BellOff size={40} color={theme.gray10?.val} />
          <Text fontSize="$5" color="$gray11" textAlign="center">
            {t("notificationsEmpty")}
          </Text>
        </YStack>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <NotificationCard notification={item} onPress={handlePress} />}
          contentContainerStyle={{ paddingVertical: 8, paddingBottom: navSpace }}
        />
      )}
    </View>
  );
}
