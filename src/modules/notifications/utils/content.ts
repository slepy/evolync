import { formatPrice } from "@/modules/core/utils/formatters";
import type { Locale } from "date-fns";
import {
  NOTIFICATION_TYPE,
  type EventAssignedPayload,
  type EventRsvpAttendingPayload,
  type JoinRequestCreatedPayload,
  type NotificationContent,
  type NotificationTarget,
  type OrderCreatedPayload,
  type PaymentCreatedPayload,
} from "../types";
import { inboxDateLocale, shortDay, shortDayRange } from "./inbox";

type Translate = (key: string, options?: Record<string, unknown>) => string;

/** `YYYY-MM-DD` → local Date at midnight (avoids the UTC shift of `new Date(iso)`). */
const parseDay = (value: unknown): Date | null => {
  if (typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
};

const text = (value: unknown, fallback: string): string =>
  typeof value === "string" && value.trim() ? value : fallback;

/**
 * Localized title/body for a notification, rendered from its stored payload
 * (N1 / N2: "Michał Kaczmarek · 3 items", "150,00 zł for 1–30 Nov").
 * Missing payload fields degrade to generic wording rather than "undefined".
 */
export function getNotificationContent(
  notification: Pick<NotificationTarget, "type" | "payload">,
  translate: Translate = t,
  now: Date = new Date(),
  locale: Locale = inboxDateLocale(translate("locale")),
): NotificationContent {
  const payload = notification.payload ?? {};
  const someone = translate("notificationSomeone");

  switch (notification.type) {
    case NOTIFICATION_TYPE.ORDER_CREATED: {
      const p = payload as OrderCreatedPayload;
      const itemCount = Number(p.itemCount) || 0;
      return {
        title: translate("notificationOrderCreatedTitle"),
        body:
          itemCount > 0
            ? translate("notificationOrderCreatedBody", {
                studentName: text(p.studentName, someone),
                count: itemCount,
              })
            : translate("notificationOrderCreatedBodyNoItems", {
                studentName: text(p.studentName, someone),
              }),
      };
    }

    case NOTIFICATION_TYPE.JOIN_REQUEST_CREATED: {
      const p = payload as JoinRequestCreatedPayload;
      return {
        title: translate("notificationJoinRequestTitle"),
        body: translate("notificationJoinRequestBody", {
          displayName: text(p.displayName, someone),
          schoolName: text(p.schoolName, translate("notificationYourSchool")),
        }),
      };
    }

    case NOTIFICATION_TYPE.EVENT_RSVP_ATTENDING: {
      const p = payload as EventRsvpAttendingPayload;
      return {
        title: translate("notificationRsvpAttendingTitle"),
        body: translate("notificationRsvpAttendingBody", {
          studentName: text(p.studentName, someone),
          eventName: text(p.eventName, translate("notificationAnEvent")),
        }),
      };
    }

    case NOTIFICATION_TYPE.PAYMENT_CREATED: {
      const p = payload as PaymentCreatedPayload;
      const amount = Number(p.amount);
      const start = parseDay(p.periodStart);
      const end = parseDay(p.periodEnd);
      return {
        title: translate("notificationPaymentCreatedTitle"),
        body: translate("notificationPaymentCreatedBody", {
          amount: Number.isFinite(amount) ? formatPrice(amount, text(p.currency, "PLN")) : "",
          period: start && end ? shortDayRange(start, end, now, locale) : "",
        }).trim(),
      };
    }

    case NOTIFICATION_TYPE.EVENT_ASSIGNED: {
      const p = payload as EventAssignedPayload;
      const start = parseDay(p.startDate);
      return {
        title: translate("notificationEventAssignedTitle"),
        body: translate("notificationEventAssignedBody", {
          eventName: text(p.eventName, translate("notificationAnEvent")),
          startDate: start ? shortDay(start, now, locale) : "",
        }),
      };
    }

    default:
      return {
        title: translate("notificationGenericTitle"),
        body: translate("notificationGenericBody"),
      };
  }
}
