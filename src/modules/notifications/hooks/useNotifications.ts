import { useEffect, useState } from "react";
import type Notification from "@/database/models/Notification";
import { NotificationRepository } from "../repositories";

/** Reactive, newest-first list of the user's notifications. */
export const useNotifications = (userId: string | undefined): Notification[] => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      return;
    }

    const subscription = NotificationRepository.observeByRecipient(userId).subscribe(setNotifications);
    return () => subscription.unsubscribe();
  }, [userId]);

  return notifications;
};
