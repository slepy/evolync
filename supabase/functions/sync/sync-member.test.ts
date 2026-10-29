// Run: supabase/functions/run-deno-tests.sh (or `deno test supabase/functions`)
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { syncOrganization } from "./sync-organization.ts";
import { syncUser } from "./sync-user.ts";
import { mergePullChanges } from "./utils.ts";

type Row = Record<string, any>;

/**
 * Supabase client stand-in over in-memory tables: applies the filters the
 * member pull uses (eq, in, is, not is null, gte, or of gte); any other call
 * (writes, ordering) chains without effect.
 */
function tableClient(tables: Record<string, Row[]>) {
  const filterFor = (prop: string, args: any[]): ((row: Row) => boolean) | null => {
    const [col, value] = args;
    switch (prop) {
      case "eq":
        return (r) => r[col] === value;
      case "in":
        return (r) => value.includes(r[col]);
      case "is":
        return (r) => (r[col] ?? null) === value;
      case "not":
        return (r) => r[col] != null;
      case "gte":
        return (r) => r[col] != null && r[col] >= value;
      case "or":
        return (r) =>
          (col as string).split(",").some((part) => {
            const [column, since] = part.split(".gte.");
            return r[column] != null && r[column] >= since;
          });
      default:
        return null;
    }
  };

  const query = (table: string, filters: ((row: Row) => boolean)[], single: boolean): any =>
    new Proxy(() => {}, {
      get(_target, prop) {
        if (prop === "then") {
          const rows = (tables[table] ?? []).filter((r) => filters.every((f) => f(r)));
          return (resolve: (value: unknown) => void) =>
            resolve({ data: single ? rows[0] ?? null : rows, error: null });
        }
        return (...args: any[]) => {
          if (prop === "maybeSingle" || prop === "single") return query(table, filters, true);
          const filter = filterFor(String(prop), args);
          return query(table, filter ? [...filters, filter] : filters, single);
        };
      },
    });
  return { from: (table: string) => query(table, [], false), rpc: () => Promise.resolve({ data: null, error: null }) };
}

const OLD = "2026-01-01T00:00:00.000Z";
const NEW = "2026-10-29T10:00:00.000Z";
const LAST_PULLED = Date.parse("2026-10-01T00:00:00.000Z");
const stamps = (at: string) => ({ created_at: at, updated_at: at, deleted_at: null });

/** "me" owns org-own (school own-s) and trains in foreign-s of org-other. */
function ownerWhoTrainsElsewhere(): Record<string, Row[]> {
  return {
    organizations: [
      { id: "org-own", owner_id: "me", ...stamps(OLD) },
      { id: "org-other", owner_id: "instructor", ...stamps(OLD) },
    ],
    schools: [
      { id: "own-s", organization_id: "org-own", ...stamps(OLD) },
      { id: "foreign-s", organization_id: "org-other", ...stamps(OLD) },
    ],
    school_members: [
      { id: "my-student", user_id: "u2", school_id: "own-s", ...stamps(OLD) },
      { id: "me-there", user_id: "me", school_id: "foreign-s", ...stamps(OLD) },
      { id: "classmate", user_id: "u3", school_id: "foreign-s", ...stamps(OLD) },
    ],
    payment_cycles: [
      { id: "own-cycle", school_id: "own-s", ...stamps(OLD) },
      { id: "foreign-cycle", school_id: "foreign-s", ...stamps(OLD) },
    ],
    payment_records: [
      { id: "own-pay", payment_cycle_id: "own-cycle", school_member_id: "my-student", ...stamps(NEW) },
      { id: "my-pay", payment_cycle_id: "foreign-cycle", school_member_id: "me-there", ...stamps(NEW) },
      { id: "classmate-pay", payment_cycle_id: "foreign-cycle", school_member_id: "classmate", ...stamps(NEW) },
    ],
  };
}

const ids = (changes: { created: Row[]; updated: Row[] } | undefined) =>
  [...(changes?.created ?? []), ...(changes?.updated ?? [])].map((r) => r.id).sort();

const ownerSync = (tables: Record<string, Row[]>, extra: Record<string, unknown> = {}) =>
  syncOrganization({
    supabaseClient: tableClient(tables),
    userId: "me",
    lastPulledAt: LAST_PULLED,
    migratedTables: [],
    columnMigratedTables: [],
    changes: {},
    ...extra,
  } as any);

Deno.test("an owner also pulls their own payment in a school of another organization", async () => {
  const { changes } = await ownerSync(ownerWhoTrainsElsewhere());

  assertEquals(ids(changes.payment_records), ["my-pay", "own-pay"]);
});

Deno.test("an owner's full member pull sends the other school's existing rows once", async () => {
  const incremental = await ownerSync(ownerWhoTrainsElsewhere());
  assertEquals(ids(incremental.changes.payment_cycles), []);

  const full = await ownerSync(ownerWhoTrainsElsewhere(), { fullMemberPull: true });
  assertEquals(ids(full.changes.schools), ["foreign-s"]);
  assertEquals(ids(full.changes.payment_cycles), ["foreign-cycle"]);
  assertEquals(ids(full.changes.school_members), ["classmate", "me-there"]);
});

Deno.test("a student without an organization still pulls only their own payments", async () => {
  const tables = ownerWhoTrainsElsewhere();
  tables.organizations = tables.organizations.filter((o) => o.owner_id !== "me");

  const { changes } = await syncUser({
    supabaseClient: tableClient(tables),
    userId: "me",
    lastPulledAt: LAST_PULLED,
    migratedTables: [],
    columnMigratedTables: [],
    changes: {},
    fullMemberPull: true,
  } as any);

  assertEquals(ids(changes.payment_records), ["my-pay"]);
  assertEquals(ids(changes.payment_cycles), ["foreign-cycle"]);
});

Deno.test("merged pulls keep a row once and do not delete a row still sent live", () => {
  const merged = mergePullChanges(
    {
      school_join_requests: { created: [{ id: "a" }], updated: [{ id: "b" }], deleted: ["c"] },
      orders: { created: [], updated: [], deleted: [] },
    },
    {
      school_join_requests: { created: [{ id: "b" }], updated: [{ id: "a" }, { id: "c" }], deleted: ["d"] },
      events: { created: [{ id: "e" }], updated: [], deleted: [] },
    },
  );

  assertEquals(merged.school_join_requests, {
    created: [{ id: "a" }, { id: "b" }],
    updated: [{ id: "c" }],
    deleted: ["d"],
  });
  assertEquals(merged.orders, { created: [], updated: [], deleted: [] });
  assertEquals(merged.events, { created: [{ id: "e" }], updated: [], deleted: [] });
});
