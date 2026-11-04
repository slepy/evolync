// Run: supabase/functions/run-deno-tests.sh (or `deno test supabase/functions`)
import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  pullNotificationsChanges,
  pushNotificationsChanges,
  toWatermelonNotification,
} from "./sync-notifications.ts";

const ME = "00000000-0000-0000-0000-00000000000a";
const OTHER = "00000000-0000-0000-0000-00000000000b";

type Call = { op: string; args: unknown[] };

/** Minimal PostgREST query-builder fake: records calls, filters rows by eq/is/gte. */
function fakeClient(rows: any[] = []) {
  const queries: { table: string; calls: Call[] }[] = [];

  const from = (table: string) => {
    const calls: Call[] = [];
    queries.push({ table, calls });
    const builder: any = {
      select: (...args: unknown[]) => (calls.push({ op: "select", args }), builder),
      update: (...args: unknown[]) => (calls.push({ op: "update", args }), builder),
      eq: (...args: unknown[]) => (calls.push({ op: "eq", args }), builder),
      is: (...args: unknown[]) => (calls.push({ op: "is", args }), builder),
      gte: (...args: unknown[]) => (calls.push({ op: "gte", args }), builder),
      then: (resolve: (v: unknown) => void) => {
        let data = rows;
        for (const { op, args } of calls) {
          const [col, val] = args as [string, any];
          if (op === "eq") data = data.filter((r) => r[col] === val);
          if (op === "is") data = data.filter((r) => (r[col] ?? null) === val);
          if (op === "gte") data = data.filter((r) => r[col] >= val);
        }
        resolve({ data, error: null });
      },
    };
    return builder;
  };

  return { client: { from }, queries };
}

const row = (overrides: Record<string, unknown> = {}) => ({
  id: crypto.randomUUID(),
  recipient_id: ME,
  organization_id: "org",
  school_id: "school",
  type: "payment_created",
  entity_type: "payment_record",
  entity_id: crypto.randomUUID(),
  payload: { amount: 150 },
  read_at: null,
  created_at: "2026-09-30T10:00:00.000Z",
  updated_at: "2026-09-30T10:00:00.000Z",
  deleted_at: null,
  ...overrides,
});

Deno.test("push applies only read_at, only for the caller's rows", async () => {
  const { client, queries } = fakeClient();
  const readAt = Date.parse("2026-10-01T08:00:00.000Z");

  await pushNotificationsChanges({
    supabaseClient: client,
    userId: ME,
    lastPulledAt: 1,
    changes: {
      notifications: {
        created: [{ id: "new", recipient_id: ME, type: "order_created" }],
        updated: [{ id: "n1", recipient_id: OTHER, type: "order_created", payload: "{}", read_at: readAt }],
        deleted: ["n2"],
      },
    },
  });

  assertEquals(queries.length, 1, "created and deleted records are ignored");
  const calls = queries[0].calls;
  assertEquals(calls[0], { op: "update", args: [{ read_at: "2026-10-01T08:00:00.000Z" }] });
  assert(calls.some((c) => c.op === "eq" && c.args[0] === "id" && c.args[1] === "n1"));
  assert(
    calls.some((c) => c.op === "eq" && c.args[0] === "recipient_id" && c.args[1] === ME),
    "update is scoped to the caller even if the record claims another recipient",
  );
});

Deno.test("push clears read_at when the client marks unread", async () => {
  const { client, queries } = fakeClient();
  await pushNotificationsChanges({
    supabaseClient: client,
    userId: ME,
    lastPulledAt: 1,
    changes: { notifications: { created: [], updated: [{ id: "n1", read_at: null }], deleted: [] } },
  });
  assertEquals(queries[0].calls[0], { op: "update", args: [{ read_at: null }] });
});

Deno.test("push soft-deletes the caller's live row", async () => {
  const { client, queries } = fakeClient();
  const deletedAt = Date.parse("2099-01-01T00:00:00.000Z");
  const readAt = Date.parse("2026-11-04T08:00:00.000Z");

  await pushNotificationsChanges({
    supabaseClient: client,
    userId: ME,
    lastPulledAt: 1,
    changes: {
      notifications: {
        created: [],
        updated: [{ id: "n1", recipient_id: OTHER, read_at: readAt, deleted_at: deletedAt }],
        deleted: [],
      },
    },
  });

  const calls = queries[0].calls;
  const [update] = calls[0].args as [{ read_at: string; deleted_at: string }];
  assertEquals(calls[0].op, "update");
  assertEquals(update.read_at, "2026-11-04T08:00:00.000Z");
  assert(
    Date.parse(update.deleted_at) < deletedAt,
    "the deletion is stamped with the server clock, not the client value",
  );
  assert(calls.some((c) => c.op === "eq" && c.args[0] === "recipient_id" && c.args[1] === ME));
  assert(
    calls.some((c) => c.op === "is" && c.args[0] === "deleted_at" && c.args[1] === null),
    "a deletion only lands on a live row (keeps the server's deletion time)",
  );
});

Deno.test("push never clears deleted_at", async () => {
  const { client, queries } = fakeClient();
  await pushNotificationsChanges({
    supabaseClient: client,
    userId: ME,
    lastPulledAt: 1,
    changes: { notifications: { created: [], updated: [{ id: "n1", read_at: null, deleted_at: null }], deleted: [] } },
  });
  assertEquals(queries[0].calls[0], { op: "update", args: [{ read_at: null }] });
  assert(!queries[0].calls.some((c) => c.op === "is"), "a live record update is not filtered");
});

Deno.test("pull never returns another user's notifications", async () => {
  const mine = row();
  const theirs = row({ recipient_id: OTHER });
  const { client } = fakeClient([mine, theirs]);

  const result = await pullNotificationsChanges({
    supabaseClient: client,
    userId: ME,
    lastPulledAt: Date.parse("2026-09-01T00:00:00.000Z"),
    changes: {},
  });

  assertEquals(result.notifications.created.map((r: any) => r.id), [mine.id]);
});

Deno.test("incremental pull splits created, updated and deleted", async () => {
  const lastPulledAt = Date.parse("2026-09-30T00:00:00.000Z");
  const fresh = row({ created_at: "2026-09-30T10:00:00.000Z", updated_at: "2026-09-30T10:00:00.000Z" });
  const touched = row({ created_at: "2026-09-20T10:00:00.000Z", updated_at: "2026-09-30T11:00:00.000Z" });
  const removed = row({
    created_at: "2026-09-20T10:00:00.000Z",
    updated_at: "2026-09-30T12:00:00.000Z",
    deleted_at: "2026-09-30T12:00:00.000Z",
  });
  const stale = row({ created_at: "2026-09-01T10:00:00.000Z", updated_at: "2026-09-01T10:00:00.000Z" });
  const { client } = fakeClient([fresh, touched, removed, stale]);

  const { notifications } = await pullNotificationsChanges({
    supabaseClient: client,
    userId: ME,
    lastPulledAt,
    changes: {},
  });

  assertEquals(notifications.created.map((r: any) => r.id), [fresh.id]);
  assertEquals(notifications.updated.map((r: any) => r.id), [touched.id]);
  assertEquals(notifications.deleted, [removed.id]);
});

Deno.test("first pull is bounded to 90 days and live rows", async () => {
  const recent = row({ created_at: new Date(Date.now() - 5 * 86_400_000).toISOString() });
  const old = row({ created_at: new Date(Date.now() - 120 * 86_400_000).toISOString() });
  const removed = row({ deleted_at: new Date().toISOString() });
  const { client } = fakeClient([recent, old, removed]);

  const { notifications } = await pullNotificationsChanges({
    supabaseClient: client,
    userId: ME,
    lastPulledAt: 0,
    changes: {},
  });

  assertEquals(notifications.created.map((r: any) => r.id), [recent.id]);
  assertEquals(notifications.updated, []);
  assertEquals(notifications.deleted, []);
});

Deno.test("a client that just migrated to the notifications table gets a first pull", async () => {
  const older = row({
    created_at: new Date(Date.now() - 10 * 86_400_000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 86_400_000).toISOString(),
  });
  const { client } = fakeClient([older]);

  const { notifications } = await pullNotificationsChanges({
    supabaseClient: client,
    userId: ME,
    lastPulledAt: Date.now() - 60_000,
    changes: {},
    migratedTables: ["notifications"],
  });

  assertEquals(notifications.created.map((r: any) => r.id), [older.id]);
});

Deno.test("rows are converted to the WatermelonDB raw shape", () => {
  const raw = toWatermelonNotification(
    row({ id: "n1", read_at: "2026-10-01T08:00:00.000Z", payload: { amount: 150, currency: "PLN" } }),
  );
  assertEquals(raw.payload, JSON.stringify({ amount: 150, currency: "PLN" }));
  assertEquals(raw.read_at, Date.parse("2026-10-01T08:00:00.000Z"));
  assertEquals(raw.created_at, Date.parse("2026-09-30T10:00:00.000Z"));
  assertEquals(raw.deleted_at, null);
  assert(!("organization_id" in raw), "server-only column is not sent to the client");
});
