import { sync } from "@/database/sync";
import { useStore } from "@/store";
import * as Notifications from "expo-notifications";
import { useRootNavigationState, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { NotificationRepository } from "../repositories";
import { markNotificationRead } from "../services";
import { getNotificationRoute, parsePushData, type PushTapTarget } from "../utils";

if (Platform.OS !== "web") {
  // Show pushes as banners while the app is in the foreground too.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/** Mark read now if the row has synced, otherwise after the next sync. */
async function markReadWhenAvailable(notificationId: string) {
  if (!(await NotificationRepository.findById(notificationId))) {
    await sync();
  }
  if (await NotificationRepository.findById(notificationId)) {
    await markNotificationRead(notificationId);
  }
}

/**
 * Root-level listener for push taps (warm: response listener; cold start:
 * last response). Routes through the same deep-link map as the inbox once the
 * router is ready and a user is signed in, and marks the notification read.
 */
export function NotificationResponseHandler() {
  const router = useRouter();
  const navigationReady = !!useRootNavigationState()?.key;
  const signedIn = useStore((s) => !!s.user?.id);
  const [pending, setPending] = useState<PushTapTarget | null>(null);
  const handled = useRef(new Set<string>());

  useEffect(() => {
    if (Platform.OS === "web") return;

    const accept = (response: Notifications.NotificationResponse | null) => {
      if (!response) return;
      const id = response.notification.request.identifier;
      if (handled.current.has(id)) return;
      handled.current.add(id);
      // The OS keeps the last response across launches; clear it so a later
      // cold start does not route to the same notification again.
      Notifications.clearLastNotificationResponse();
      setPending(parsePushData(response.notification.request.content.data));
    };

    Notifications.getLastNotificationResponseAsync().then(accept).catch(console.error);
    const subscription = Notifications.addNotificationResponseReceivedListener(accept);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!pending || !navigationReady || !signedIn) return;
    setPending(null);

    if (pending.kind === "inbox") {
      router.push("/notifications" as any);
      return;
    }

    if (pending.notificationId) {
      markReadWhenAvailable(pending.notificationId).catch((err) =>
        console.error("[NotificationResponseHandler] markRead:", err),
      );
    }
    router.push((getNotificationRoute(pending.target) ?? "/notifications") as any);
  }, [pending, navigationReady, signedIn, router]);

  return null;
}
