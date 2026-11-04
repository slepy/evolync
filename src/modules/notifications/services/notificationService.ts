import { sync } from "@/database/sync";
import { NotificationRepository } from "../repositories";

export const markNotificationRead = async (id: string) => {
  await NotificationRepository.markRead(id);
  sync().catch((err) => console.error("[markNotificationRead] Sync:", err));
};

export const markAllNotificationsRead = async (recipientId: string) => {
  const marked = await NotificationRepository.markAllRead(recipientId);
  if (marked > 0) {
    sync().catch((err) => console.error("[markAllNotificationsRead] Sync:", err));
  }
  return marked;
};

export const deleteNotification = async (id: string) => {
  await NotificationRepository.softDelete(id);
  sync().catch((err) => console.error("[deleteNotification] Sync:", err));
};

export const deleteAllNotifications = async (recipientId: string) => {
  const deleted = await NotificationRepository.softDeleteAll(recipientId);
  if (deleted > 0) {
    sync().catch((err) => console.error("[deleteAllNotifications] Sync:", err));
  }
  return deleted;
};
