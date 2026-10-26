import type { NotificationType } from "./enums";

/** N1 — owner: new order. */
export interface OrderCreatedPayload {
  studentName?: string;
  itemCount?: number;
  orderId?: string;
}

/** N2 — owner: new join request. */
export interface JoinRequestCreatedPayload {
  displayName?: string;
  schoolName?: string;
}

/** N3 — owner: student RSVPs "attending". */
export interface EventRsvpAttendingPayload {
  studentName?: string;
  eventName?: string;
  eventId?: string;
}

/** N4 — student: new payment record. Dates are ISO `YYYY-MM-DD`. */
export interface PaymentCreatedPayload {
  amount?: number | string;
  currency?: string;
  periodStart?: string;
  periodEnd?: string;
  paymentCycleId?: string;
}

/** N5 — student: added to an event. `startDate` is ISO `YYYY-MM-DD`. */
export interface EventAssignedPayload {
  eventName?: string;
  startDate?: string;
  eventId?: string;
}

/** N6 — student: join request approved. */
export interface JoinRequestApprovedPayload {
  schoolName?: string;
  schoolId?: string;
}

export interface NotificationPayloadByType {
  order_created: OrderCreatedPayload;
  join_request_created: JoinRequestCreatedPayload;
  event_rsvp_attending: EventRsvpAttendingPayload;
  payment_created: PaymentCreatedPayload;
  event_assigned: EventAssignedPayload;
  join_request_approved: JoinRequestApprovedPayload;
}

/** The fields routing and rendering need — satisfied by the Notification model and push data. */
export interface NotificationTarget {
  type: NotificationType | string;
  entityId: string;
  schoolId?: string | null;
  payload?: Record<string, unknown>;
}

export interface NotificationContent {
  title: string;
  body: string;
}
