import { NOTIFICATION_TYPE, type NotificationTarget } from "../types";

/**
 * The local row a notification's deep link opens directly, when it opens a
 * single entity rather than a list. Used to detect "no longer available".
 */
export function getNotificationEntityRef(
  notification: NotificationTarget,
): { table: string; id: string } | null {
  const { type, entityId, schoolId, payload = {} } = notification;

  switch (type) {
    case NOTIFICATION_TYPE.ORDER_CREATED:
      return schoolId ? { table: "orders", id: entityId } : null;
    case NOTIFICATION_TYPE.EVENT_RSVP_ATTENDING:
      return typeof payload.eventId === "string" ? { table: "events", id: payload.eventId } : null;
    default:
      return null;
  }
}
