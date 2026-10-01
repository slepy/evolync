import { useEffect, useState } from "react";
import { NotificationRepository } from "../repositories";

/** Reactive unread notification count for the bell badge. */
export const useUnreadNotificationCount = (userId: string | undefined): number => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) {
      setCount(0);
      return;
    }

    const subscription = NotificationRepository.observeUnreadCount(userId).subscribe(setCount);
    return () => subscription.unsubscribe();
  }, [userId]);

  return count;
};
