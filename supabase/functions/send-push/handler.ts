/**
 * send-push core logic, separated from Deno.serve so it can be unit tested
 * with a fake Supabase client and a mocked fetch.
 *
 * Invoked once per notifications INSERT (database webhook). Loads the
 * recipient's enabled tokens, renders localized text, coalesces bursts and
 * calls the Expo Push API. Push failures never affect the inbox row.
 */
import { normalizeLocale, renderBurstSummary, renderPush } from "./templates.ts";

export const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
/** Expo accepts at most 100 messages per request. */
export const EXPO_BATCH_SIZE = 100;
/** More than this many notifications for one recipient inside the window → one summary push. */
export const BURST_LIMIT = 3;
export const BURST_WINDOW_MS = 60_000;
export const ANDROID_CHANNEL_ID = "default";

export interface NotificationRecord {
  id: string;
  recipient_id: string;
  school_id?: string | null;
  type: string;
  entity_type: string;
  entity_id: string;
  payload?: Record<string, unknown> | null;
  created_at?: string;
  deleted_at?: string | null;
}

export interface SendPushDeps {
  supabase: any;
  fetch: typeof fetch;
  expoAccessToken?: string;
  now?: () => number;
}

export type SendPushResult =
  | { status: "skipped"; reason: string }
  | { status: "sent"; messages: number; invalidTokens: number; mode: "single" | "summary" };

type PushToken = { id: string; token: string; locale: string | null };

/** Parse a Supabase Database Webhook body (or a bare record) into a notification. */
export function parseWebhookRecord(body: any): NotificationRecord | null {
  const record = body?.record ?? body;
  if (!record || typeof record !== "object") return null;
  if (body?.type && body.type !== "INSERT") return null;
  if (typeof record.recipient_id !== "string" || typeof record.type !== "string") return null;
  return record as NotificationRecord;
}

/** How many notifications the recipient got in the burst window, up to and including this one. */
async function countRecent(deps: SendPushDeps, record: NotificationRecord): Promise<number> {
  const createdAt = record.created_at ? Date.parse(record.created_at) : (deps.now ?? Date.now)();
  const since = new Date(createdAt - BURST_WINDOW_MS).toISOString();
  const until = new Date(createdAt).toISOString();

  const { count, error } = await deps.supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", record.recipient_id)
    .gte("created_at", since)
    .lte("created_at", until);

  if (error) {
    console.error("[send-push] Burst count failed, sending individually:", error);
    return 1;
  }
  return count ?? 1;
}

export async function handleSendPush(body: unknown, deps: SendPushDeps): Promise<SendPushResult> {
  const record = parseWebhookRecord(body);
  if (!record) return { status: "skipped", reason: "not a notification insert" };
  if (record.deleted_at) return { status: "skipped", reason: "notification deleted" };

  const { data: tokens, error: tokenError } = await deps.supabase
    .from("push_tokens")
    .select("id, token, locale")
    .eq("user_id", record.recipient_id)
    .eq("enabled", true)
    .is("deleted_at", null);

  if (tokenError) {
    console.error("[send-push] Loading tokens failed:", tokenError);
    return { status: "skipped", reason: "token lookup failed" };
  }
  if (!tokens || tokens.length === 0) return { status: "skipped", reason: "no active tokens" };

  const recent = await countRecent(deps, record);
  if (recent > BURST_LIMIT + 1) return { status: "skipped", reason: "burst already summarized" };
  const mode = recent === BURST_LIMIT + 1 ? "summary" : "single";

  const messages = (tokens as PushToken[]).map((t) => {
    const locale = normalizeLocale(t.locale);
    const content =
      mode === "summary" ? renderBurstSummary(recent, locale) : renderPush(record.type, record.payload ?? {}, locale);
    return {
      to: t.token,
      title: content.title,
      body: content.body,
      sound: "default",
      channelId: ANDROID_CHANNEL_ID,
      data:
        mode === "summary"
          ? { type: "summary" }
          : {
              notificationId: record.id,
              type: record.type,
              entityType: record.entity_type,
              entityId: record.entity_id,
              ...(record.school_id ? { schoolId: record.school_id } : {}),
              // N3 links to the event, which is not the source entity (a participant row).
              ...(typeof record.payload?.eventId === "string" ? { eventId: record.payload.eventId } : {}),
            },
    };
  });

  const invalidTokenIds: string[] = [];

  for (let i = 0; i < messages.length; i += EXPO_BATCH_SIZE) {
    const batch = messages.slice(i, i + EXPO_BATCH_SIZE);
    const batchTokens = (tokens as PushToken[]).slice(i, i + EXPO_BATCH_SIZE);

    try {
      const response = await deps.fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(deps.expoAccessToken ? { Authorization: `Bearer ${deps.expoAccessToken}` } : {}),
        },
        body: JSON.stringify(batch),
      });

      if (!response.ok) {
        console.error(`[send-push] Expo push API responded ${response.status}`);
        continue;
      }

      const { data: tickets = [] } = await response.json();
      tickets.forEach((ticket: any, index: number) => {
        if (ticket?.status === "error" && ticket?.details?.error === "DeviceNotRegistered") {
          invalidTokenIds.push(batchTokens[index].id);
        } else if (ticket?.status === "error") {
          console.error("[send-push] Expo ticket error:", ticket.message ?? ticket);
        }
      });
    } catch (error) {
      console.error("[send-push] Expo push request failed:", error);
    }
  }

  if (invalidTokenIds.length > 0) {
    const { error } = await deps.supabase
      .from("push_tokens")
      .update({ enabled: false, deleted_at: new Date((deps.now ?? Date.now)()).toISOString() })
      .in("id", invalidTokenIds);
    if (error) console.error("[send-push] Soft-deleting invalid tokens failed:", error);
  }

  return { status: "sent", messages: messages.length, invalidTokens: invalidTokenIds.length, mode };
}
