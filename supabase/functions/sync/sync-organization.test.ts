// Run: supabase/functions/run-deno-tests.sh (or `deno test supabase/functions`)
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { syncOrganization } from "./sync-organization.ts";

/**
 * Supabase client stand-in: every query builder call chains, awaiting a query
 * resolves to no rows (the owner's organization for its lookup; an update the
 * row it matched by id, none for ids in `missing`), and writes are logged as
 * "<method> <table>" (upserts with the ids they carry).
 */
function recordingClient(writes: string[], missing: string[] = []) {
  const query = (table: string, calls: string[], id?: string): any =>
    new Proxy(() => {}, {
      get(_target, prop) {
        if (prop === "then") {
          const data = table === "organizations" && calls.includes("maybeSingle")
            ? { id: "org1" }
            : calls.includes("update") && id && !missing.includes(id)
            ? [{ id }]
            : [];
          return (resolve: (value: unknown) => void) => resolve({ data, error: null });
        }
        return (...args: any[]) => {
          if (prop === "upsert") writes.push(`upsert ${table} ${args[0].map((r: any) => r.id).join(",")}`);
          else if (prop === "update" || prop === "insert") writes.push(`${String(prop)} ${table}`);
          const matched = prop === "eq" && args[0] === "id" ? args[1] : id;
          return query(table, [...calls, String(prop)], matched);
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
    writes.filter((w) => w.includes(" training_sessions")),
    ["update training_sessions", "upsert training_sessions new"],
  );
});

Deno.test("an edited product the server doesn't hold is inserted before its new variant", async () => {
  const writes: string[] = [];

  await syncOrganization({
    supabaseClient: recordingClient(writes, ["gone"]),
    userId: "owner",
    lastPulledAt: 0,
    migratedTables: [],
    columnMigratedTables: [],
    changes: {
      products: {
        created: [],
        updated: [{ id: "gone", organization_id: "org1", name: "Belt" }, { id: "kept", organization_id: "org1", name: "Gi" }],
        deleted: [],
      },
      product_variants: { created: [{ id: "m", product_id: "gone", price: 80 }], updated: [], deleted: [] },
    },
  } as any);

  assertEquals(
    writes.filter((w) => w.includes(" product")),
    ["update products", "update products", "upsert products gone", "upsert product_variants m"],
  );
});
