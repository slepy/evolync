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
