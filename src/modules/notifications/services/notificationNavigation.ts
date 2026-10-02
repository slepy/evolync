import { NotificationRepository } from "../repositories";
import type { NotificationTarget } from "../types";
import { getNotificationEntityRef, getNotificationRoute } from "../utils";

export type NotificationOpenResult =
  | { status: "navigate"; route: string }
  | { status: "unavailable" }
  | { status: "no-route" };

/**
 * Where tapping a notification should go. A link to a single entity that no
 * longer exists locally resolves to "unavailable" instead of a broken screen.
 */
export const resolveNotificationOpen = async (
  notification: NotificationTarget,
): Promise<NotificationOpenResult> => {
  const route = getNotificationRoute(notification);
  if (!route) return { status: "no-route" };

  const ref = getNotificationEntityRef(notification);
  if (ref && !(await NotificationRepository.entityExists(ref.table, ref.id))) {
    return { status: "unavailable" };
  }

  return { status: "navigate", route };
};
