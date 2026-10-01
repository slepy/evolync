import type { NotificationTarget } from "../types";

export type PushTapTarget =
  | { kind: "notification"; notificationId: string | null; target: NotificationTarget }
  | { kind: "inbox" };

/**
 * Map the `data` of a tapped push (see send-push) to what the app should
 * open. Summary pushes and anything unrecognised open the inbox.
 */
export function parsePushData(data: unknown): PushTapTarget {
  if (!data || typeof data !== "object") return { kind: "inbox" };
  const d = data as Record<string, unknown>;
  if (typeof d.type !== "string" || typeof d.entityId !== "string") return { kind: "inbox" };

  return {
    kind: "notification",
    notificationId: typeof d.notificationId === "string" ? d.notificationId : null,
    target: {
      type: d.type,
      entityId: d.entityId,
      schoolId: typeof d.schoolId === "string" ? d.schoolId : null,
      payload: typeof d.eventId === "string" ? { eventId: d.eventId } : {},
    },
  };
}
