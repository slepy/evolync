// Run: supabase/functions/run-deno-tests.sh
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { EXPO_PUSH_URL, handleSendPush, parseWebhookRecord } from "./handler.ts";
import { renderPush } from "./templates.ts";

const RECIPIENT = "00000000-0000-0000-0000-0000000000b1";

const notification = (overrides: Record<string, unknown> = {}) => ({
  id: "n1",
  recipient_id: RECIPIENT,
  school_id: "s1",
  type: "event_assigned",
  entity_type: "event_participant",
  entity_id: "p1",
  payload: { eventName: "Winter Cup", startDate: "2026-12-01", eventId: "e1" },
  created_at: "2026-10-01T10:00:00.000Z",
  deleted_at: null,
  ...overrides,
});

/** Fake Supabase client: serves tokens and a burst count, records updates. */
function fakeSupabase({ tokens = [] as any[], recentCount = 1 } = {}) {
  const updates: { table: string; values: any; ids: string[] }[] = [];
  const from = (table: string) => {
    const state: any = { table, filters: [] as unknown[] };
    const builder: any = {
      select: (_cols: string, opts?: { head?: boolean }) => ((state.head = !!opts?.head), builder),
      update: (values: any) => ((state.update = values), builder),
      eq: (...args: unknown[]) => (state.filters.push(["eq", ...args]), builder),
      is: (...args: unknown[]) => (state.filters.push(["is", ...args]), builder),
      gte: (...args: unknown[]) => (state.filters.push(["gte", ...args]), builder),
      lte: (...args: unknown[]) => (state.filters.push(["lte", ...args]), builder),
      in: (_col: string, ids: string[]) => {
        updates.push({ table, values: state.update, ids });
        return Promise.resolve({ error: null });
      },
      then: (resolve: (v: unknown) => void) => {
        if (table === "push_tokens") resolve({ data: tokens, error: null });
        else if (table === "notifications" && state.head) resolve({ count: recentCount, error: null });
        else resolve({ data: [], error: null });
      },
    };
    return builder;
  };
  return { client: { from }, updates };
}

function mockFetch(tickets: (batch: any[]) => any[] = (b) => b.map(() => ({ status: "ok", id: "t" }))) {
  const requests: { url: string; init: RequestInit; batch: any[] }[] = [];
  const fn = (async (url: string, init: RequestInit) => {
    const batch = JSON.parse(String(init.body));
    requests.push({ url, init, batch });
    return new Response(JSON.stringify({ data: tickets(batch) }), { status: 200 });
  }) as unknown as typeof fetch;
  return { fn, requests };
}

Deno.test("single notification → one localized message per active token", async () => {
  const { client } = fakeSupabase({
    tokens: [
      { id: "t-en", token: "ExponentPushToken[en]", locale: "en" },
      { id: "t-pl", token: "ExponentPushToken[pl]", locale: "pl" },
    ],
  });
  const fetch = mockFetch();

  const result = await handleSendPush({ type: "INSERT", table: "notifications", record: notification() }, {
    supabase: client,
    fetch: fetch.fn,
  });

  assertEquals(result, { status: "sent", messages: 2, invalidTokens: 0, mode: "single" });
  assertEquals(fetch.requests.length, 1);
  assertEquals(fetch.requests[0].url, EXPO_PUSH_URL);
  const [en, pl] = fetch.requests[0].batch;
  assertEquals(en.to, "ExponentPushToken[en]");
  assertEquals(en.title, "Added to an event");
  assertEquals(en.body, "You've been added to Winter Cup on 1 Dec 2026");
  assertEquals(pl.title, "Dodano Cię do wydarzenia");
  assertEquals(en.data, {
    notificationId: "n1",
    type: "event_assigned",
    entityType: "event_participant",
    entityId: "p1",
    schoolId: "s1",
    eventId: "e1",
  });
  assertEquals(en.channelId, "default");
});

Deno.test("burst: the 4th notification in 60s becomes one summary, later ones are skipped", async () => {
  const tokens = [{ id: "t1", token: "ExponentPushToken[a]", locale: "en" }];

  const third = mockFetch();
  const r3 = await handleSendPush({ record: notification() }, {
    supabase: fakeSupabase({ tokens, recentCount: 3 }).client,
    fetch: third.fn,
  });
  assertEquals(r3.status === "sent" && r3.mode, "single");

  const fourth = mockFetch();
  const r4 = await handleSendPush({ record: notification() }, {
    supabase: fakeSupabase({ tokens, recentCount: 4 }).client,
    fetch: fourth.fn,
  });
  assertEquals(r4.status === "sent" && r4.mode, "summary");
  assertEquals(fourth.requests[0].batch[0].body, "You have 4+ new notifications");
  assertEquals(fourth.requests[0].batch[0].data, { type: "summary" });

  const fifth = mockFetch();
  const r5 = await handleSendPush({ record: notification() }, {
    supabase: fakeSupabase({ tokens, recentCount: 5 }).client,
    fetch: fifth.fn,
  });
  assertEquals(r5, { status: "skipped", reason: "burst already summarized" });
  assertEquals(fifth.requests.length, 0);
});

Deno.test("DeviceNotRegistered tokens are soft-deleted; others kept", async () => {
  const { client, updates } = fakeSupabase({
    tokens: [
      { id: "good", token: "ExponentPushToken[good]", locale: "en" },
      { id: "gone", token: "ExponentPushToken[gone]", locale: "en" },
    ],
  });
  const fetch = mockFetch(() => [
    { status: "ok", id: "1" },
    { status: "error", message: "not registered", details: { error: "DeviceNotRegistered" } },
  ]);

  const result = await handleSendPush({ record: notification() }, {
    supabase: client,
    fetch: fetch.fn,
    now: () => Date.parse("2026-10-01T10:00:05.000Z"),
  });

  assertEquals(result, { status: "sent", messages: 2, invalidTokens: 1, mode: "single" });
  assertEquals(updates.length, 1);
  assertEquals(updates[0].table, "push_tokens");
  assertEquals(updates[0].ids, ["gone"]);
  assertEquals(updates[0].values, { enabled: false, deleted_at: "2026-10-01T10:00:05.000Z" });
});

Deno.test("no tokens → nothing sent", async () => {
  const fetch = mockFetch();
  const result = await handleSendPush({ record: notification() }, {
    supabase: fakeSupabase({ tokens: [] }).client,
    fetch: fetch.fn,
  });
  assertEquals(result, { status: "skipped", reason: "no active tokens" });
  assertEquals(fetch.requests.length, 0);
});

Deno.test("Expo outage is swallowed so the webhook is not retried", async () => {
  const failing = (async () => {
    throw new Error("network down");
  }) as unknown as typeof fetch;
  const result = await handleSendPush({ record: notification() }, {
    supabase: fakeSupabase({ tokens: [{ id: "t1", token: "x", locale: "en" }] }).client,
    fetch: failing,
  });
  assertEquals(result.status, "sent");
});

Deno.test("sends the Expo access token when configured", async () => {
  const fetch = mockFetch();
  await handleSendPush({ record: notification() }, {
    supabase: fakeSupabase({ tokens: [{ id: "t1", token: "x", locale: "en" }] }).client,
    fetch: fetch.fn,
    expoAccessToken: "expo-token",
  });
  assertEquals((fetch.requests[0].init.headers as Record<string, string>).Authorization, "Bearer expo-token");
});

Deno.test("only INSERT webhooks with a notification record are handled", () => {
  assertEquals(parseWebhookRecord({ type: "UPDATE", record: notification() }), null);
  assertEquals(parseWebhookRecord({ type: "INSERT", record: { foo: 1 } }), null);
  assert(parseWebhookRecord({ type: "INSERT", record: notification() }));
});

Deno.test("templates render every type in both locales without 'undefined'", () => {
  const payloads: Record<string, Record<string, unknown>> = {
    order_created: { studentName: "Ola", itemCount: 2 },
    join_request_created: { displayName: "Jan", schoolName: "Dojo" },
    event_rsvp_attending: { studentName: "Ola", eventName: "Camp" },
    payment_created: { amount: "150.00", currency: "PLN", periodStart: "2026-10-01", periodEnd: "2026-10-31" },
    event_assigned: { eventName: "Cup", startDate: "2026-12-01" },
  };
  for (const [type, payload] of Object.entries(payloads)) {
    for (const locale of ["en", "pl"] as const) {
      for (const p of [payload, {}]) {
        const { title, body } = renderPush(type, p, locale);
        assert(title && body, `${type}/${locale} renders`);
        assert(!`${title} ${body}`.includes("undefined"), `${type}/${locale}: ${body}`);
      }
    }
  }
  // Intl separates currency and amount with a non-breaking space.
  assertEquals(
    renderPush("payment_created", payloads.payment_created, "en").body.replace(/\s/g, " "),
    "New payment: PLN 150.00 for 1 Oct 2026 – 31 Oct 2026",
  );
});
