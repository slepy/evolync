// Run: supabase/functions/run-deno-tests.sh (or `deno test supabase/functions`)
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { syncOrganization } from "./sync-organization.ts";

/**
 * Supabase client stand-in: every query builder call chains, awaiting a query
 * resolves to no rows (the owner's organization for its lookup), and writes
 * are logged as "<method> <table>".
 */
function recordingClient(writes: string[]) {
  const query = (table: string, calls: string[]): any =>
    new Proxy(() => {}, {
      get(_target, prop) {
        if (prop === "then") {
          const data = table === "organizations" && calls.includes("maybeSingle") ? { id: "org1" } : [];
          return (resolve: (value: unknown) => void) => resolve({ data, error: null });
        }
        return () => {
          if (prop === "upsert" || prop === "update" || prop === "insert") writes.push(`${String(prop)} ${table}`);
          return query(table, [...calls, String(prop)]);
        };
      },
    });
  return { from: (table: string) => query(table, []) };
}

Deno.test("a deleted session is pushed before the session that replaces it on the same day", async () => {
  const writes: string[] = [];
  const day = Date.UTC(2026, 9, 29);

  await syncOrganization({
    supabaseClient: recordingClient(writes),
    userId: "owner",
    lastPulledAt: 0,
    migratedTables: [],
    columnMigratedTables: [],
    changes: {
      training_sessions: {
        created: [{ id: "new", school_id: "s1", date: day + 18 * 3_600_000 }],
        updated: [{ id: "old", school_id: "s1", date: day + 17 * 3_600_000, deleted_at: day + 20 * 3_600_000 }],
        deleted: [],
      },
    },
  } as any);

  assertEquals(
    writes.filter((w) => w.endsWith(" training_sessions")),
    ["update training_sessions", "upsert training_sessions"],
  );
});
