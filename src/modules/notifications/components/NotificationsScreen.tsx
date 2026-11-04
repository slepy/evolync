import {
  EmptyState,
  IconButton,
  ListCard,
  ListSection,
  MainNav,
  Notice,
  SwipeToDelete,
  TabPage,
  TrashButton,
  useNavHome,
} from "@/core/components";
import { confirmDelete } from "@/core/utils/confirmDelete";
import type Notification from "@/database/models/Notification";
import { useStore } from "@/store";
import { BellOff, CheckCheck } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { XStack } from "tamagui";
import { useNotifications, useOpenNotification } from "../hooks";
import {
  deleteAllNotifications,
  deleteNotification,
  markAllNotificationsRead,
  markNotificationRead,
  resolveNotificationOpen,
} from "../services";
import { getNotificationContent, groupInbox, inboxDateLocale, inboxTimeLabel, type InboxGroupKey } from "../utils";
import { notificationRowStyle } from "../utils/rowStyle";
import { NotificationRow } from "./NotificationRow";

const UNAVAILABLE_NOTICE_MS = 2500;
const CLOCK_TICK_MS = 60_000;

const GROUP_LABEL: Record<InboxGroupKey, string> = {
  today: "notificationsGroupToday",
  yesterday: "yesterday",
  earlier: "notificationsGroupEarlier",
};

/** Current time, refreshed every minute so "12 min" and the day groups stay right. */
function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), CLOCK_TICK_MS);
    return () => clearInterval(timer);
  }, []);
  return now;
}

/**
 * Alerts tab (N1–N4), shared by owners and students: day groups with the
 * unread count, module-colored rows, Mark all as read, swipe a row left to
 * delete it, Delete all. Reads from WatermelonDB, so it renders offline;
 * marking read and deleting are local-first and sync in the background.
 */
export function NotificationsScreen() {
  const openNotification = useOpenNotification();
  const home = useNavHome();
  const userId = useStore((s) => s.user?.id);
  const notifications = useNotifications(userId);
  const now = useNow();
  const locale = inboxDateLocale(t("locale"));
  const groups = useMemo(() => groupInbox(notifications, now), [notifications, now]);
  const hasUnread = groups.some((g) => g.unread > 0);

  const [unavailableVisible, setUnavailableVisible] = useState(false);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
  }, []);

  const showUnavailable = useCallback(() => {
    setUnavailableVisible(true);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setUnavailableVisible(false), UNAVAILABLE_NOTICE_MS);
  }, []);

  const handlePress = useCallback(
    async (notification: Notification) => {
      markNotificationRead(notification.id).catch((err) =>
        console.error("[NotificationsScreen] markRead:", err),
      );

      const result = await resolveNotificationOpen(notification);
      if (result.status === "navigate") {
        // No longer a member of that school / owner: same notice as a gone entity.
        if (!openNotification(notification, result.route)) showUnavailable();
      } else if (result.status === "unavailable") {
        showUnavailable();
      }
    },
    [openNotification, showUnavailable],
  );

  const handleMarkAllRead = useCallback(() => {
    if (!userId) return;
    markAllNotificationsRead(userId).catch((err) =>
      console.error("[NotificationsScreen] markAllRead:", err),
    );
  }, [userId]);

  const handleDelete = useCallback((id: string) => {
    deleteNotification(id).catch((err) => console.error("[NotificationsScreen] delete:", err));
  }, []);

  const handleDeleteAll = useCallback(() => {
    if (!userId) return;
    confirmDelete(t("notificationsDeleteAllTitle"), t("notificationsDeleteAllMessage"), () => {
      deleteAllNotifications(userId).catch((err) =>
        console.error("[NotificationsScreen] deleteAll:", err),
      );
    });
  }, [userId]);

  return (
    <TabPage
      title={t("notificationsTitle")}
      context={home}
      actions={
        groups.length > 0 ? (
          <XStack gap={10}>
            {hasUnread ? (
              <IconButton icon={CheckCheck} label={t("notificationsMarkAllRead")} onPress={handleMarkAllRead} />
            ) : null}
            <TrashButton label={t("notificationsDeleteAll")} onPress={handleDeleteAll} />
          </XStack>
        ) : null
      }
      nav={<MainNav />}
    >
      {unavailableVisible ? <Notice text={t("notificationsUnavailable")} /> : null}

      {groups.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title={t("notificationsEmpty")}
          text={t(home === "organization" ? "notificationsEmptyHintOwner" : "notificationsEmptyHintStudent")}
        />
      ) : (
        groups.map((group) => (
          <ListSection
            key={group.key}
            variant="label"
            title={t(GROUP_LABEL[group.key])}
            chip={group.unread > 0 ? t("notificationsNewCount", { count: group.unread }) : undefined}
            accent="danger"
          >
            <ListCard>
              {group.items.map((notification) => {
                const { title, body } = getNotificationContent(notification, t, now, locale);
                const style = notificationRowStyle(notification.type);
                return (
                  <SwipeToDelete key={notification.id} onDelete={() => handleDelete(notification.id)}>
                    <NotificationRow
                      title={title}
                      body={body}
                      time={inboxTimeLabel(notification.createdAt, now, t, locale)}
                      unread={!notification.readAt}
                      icon={style.icon}
                      accent={style.accent}
                      onPress={() => handlePress(notification)}
                      onDelete={() => handleDelete(notification.id)}
                    />
                  </SwipeToDelete>
                );
              })}
            </ListCard>
          </ListSection>
        ))
      )}
    </TabPage>
  );
}
