/**
 * send-push — delivers one notification as Expo push messages.
 *
 * Called by the `notifications` INSERT webhook trigger with the shared secret
 * in `x-send-push-secret`. Always answers 200 once authenticated, so a push
 * outage never causes webhook retry storms; the inbox row is the source of truth.
 *
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SEND_PUSH_SECRET,
 *      EXPO_ACCESS_TOKEN (optional, when Expo enhanced push security is on).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { handleSendPush } from "./handler.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

/** Constant-time comparison so the secret cannot be guessed byte by byte. */
function safeEqual(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i++) diff |= left[i] ^ right[i];
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const secret = Deno.env.get("SEND_PUSH_SECRET") ?? "";
  const provided = req.headers.get("x-send-push-secret") ?? "";
  if (!secret || !safeEqual(provided, secret)) {
    return json({ error: "Unauthorized" }, 401);
  }

  try {
    const body = await req.json();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const result = await handleSendPush(body, {
      supabase,
      fetch,
      expoAccessToken: Deno.env.get("EXPO_ACCESS_TOKEN") ?? undefined,
    });

    console.log("[send-push]", JSON.stringify(result));
    return json(result);
  } catch (error) {
    console.error("[send-push] Unexpected error:", error);
    return json({ status: "skipped", reason: "internal error" });
  }
});
