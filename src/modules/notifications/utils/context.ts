import { NOTIFICATION_TYPE, type NotificationTarget } from "../types";

/** Who a notification type is addressed to: the organization owner or a school member. */
export type NotificationAudience = "owner" | "student";

/** Dashboard a notification opens over — same values as the bottom nav's Home. */
export type NotificationHome = "organization" | "student";

export function getNotificationAudience(type: NotificationTarget["type"]): NotificationAudience | null {
  switch (type) {
    case NOTIFICATION_TYPE.ORDER_CREATED:
    case NOTIFICATION_TYPE.JOIN_REQUEST_CREATED:
    case NOTIFICATION_TYPE.EVENT_RSVP_ATTENDING:
      return "owner";
    case NOTIFICATION_TYPE.PAYMENT_CREATED:
    case NOTIFICATION_TYPE.EVENT_ASSIGNED:
      return "student";
    default:
      return null;
  }
}

export interface NotificationContextState {
  ownsOrganization: boolean;
  memberships: { memberId: string; schoolId: string }[];
  activeMembershipId: string | null;
  /** Context currently shown (the bottom nav's Home). */
  home: NotificationHome;
}

export interface NotificationContextPlan {
  home: NotificationHome;
  /** Membership to make active before opening (student notifications). */
  membershipId: string | null;
  /** The app shows another context (or another school): reset to `home` first. */
  switchContext: boolean;
}

/**
 * The context a notification must be opened in, so a student notification
 * shows the student's screens of that school and an owner notification the
 * organization's. Null when the user no longer has that role (or the school
 * membership is gone): the caller falls back to the inbox / "no longer
 * available".
 */
export function planNotificationContext(
  notification: Pick<NotificationTarget, "type" | "schoolId">,
  state: NotificationContextState,
): NotificationContextPlan | null {
  const audience = getNotificationAudience(notification.type);

  if (audience === "owner") {
    if (!state.ownsOrganization) return null;
    return { home: "organization", membershipId: null, switchContext: state.home !== "organization" };
  }

  if (audience === "student") {
    const membership = notification.schoolId
      ? state.memberships.find((m) => m.schoolId === notification.schoolId)
      : (state.memberships.find((m) => m.memberId === state.activeMembershipId) ?? state.memberships[0]);
    if (!membership) return null;
    return {
      home: "student",
      membershipId: membership.memberId,
      switchContext: state.home !== "student" || membership.memberId !== state.activeMembershipId,
    };
  }

  return null;
}

/** Launch-path routes (index, sign in / sign up / OAuth callback) that the session restore replaces. */
export const isLaunchRoute = (pathname: string): boolean => {
  const path = pathname.replace(/\/+$/, "") || "/";
  return path === "/" || path === "/auth" || path.startsWith("/auth/");
};
