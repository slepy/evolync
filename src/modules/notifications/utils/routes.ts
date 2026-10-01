import { NOTIFICATION_TYPE, type NotificationTarget } from "../types";

/**
 * Deep link for a notification — shared by the inbox and the push-tap handler.
 * Returns null for unknown types (e.g. a newer server type on an old client)
 * or when a required id is missing.
 */
export function getNotificationRoute(notification: NotificationTarget): string | null {
  const { type, entityId, schoolId, payload = {} } = notification;

  switch (type) {
    case NOTIFICATION_TYPE.ORDER_CREATED:
      return schoolId ? `/school/${schoolId}/orders/${entityId}` : "/organization/orders";

    case NOTIFICATION_TYPE.JOIN_REQUEST_CREATED:
      return schoolId ? `/school/${schoolId}/students?tab=requests` : null;

    case NOTIFICATION_TYPE.EVENT_RSVP_ATTENDING: {
      const eventId = typeof payload.eventId === "string" ? payload.eventId : null;
      return eventId ? `/organization/events/${eventId}` : "/organization/events";
    }

    case NOTIFICATION_TYPE.PAYMENT_CREATED:
      return "/user/payments";

    case NOTIFICATION_TYPE.EVENT_ASSIGNED:
      return "/user/events";

    default:
      return null;
  }
}
