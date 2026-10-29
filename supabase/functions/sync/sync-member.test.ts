// Run: supabase/functions/run-deno-tests.sh (or `deno test supabase/functions`)
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { syncOrganization } from "./sync-organization.ts";
import { syncUser } from "./sync-user.ts";
import { mergePullChanges, splitStudentChanges } from "./utils.ts";

type Row = Record<string, any>;

/**
 * Supabase client stand-in over in-memory tables: applies the filters the
 * member pull uses (eq, in, is, not is null, gte, or of gte); writes are
 * logged to `writes` (not applied), any other call chains without effect.
 */
function tableClient(tables: Record<string, Row[]>, writes: { op: string; table: string; rows: Row[] }[] = []) {
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
          if (prop === "upsert" || prop === "update") {
            writes.push({ op: String(prop), table, rows: [args[0]].flat() });
          }
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

Deno.test("an owner pulls their attendance, events and orders in a school of another organization", async () => {
  const tables = ownerWhoTrainsElsewhere();
  tables.training_sessions = [
    { id: "own-session", school_id: "own-s", ...stamps(NEW) },
    { id: "foreign-session", school_id: "foreign-s", ...stamps(OLD) },
  ];
  tables.attendance_records = [
    { id: "own-att", training_session_id: "own-session", school_member_id: "my-student", ...stamps(NEW) },
    { id: "my-att", training_session_id: "foreign-session", school_member_id: "me-there", ...stamps(NEW) },
    { id: "classmate-att", training_session_id: "foreign-session", school_member_id: "classmate", ...stamps(NEW) },
  ];
  tables.events = [
    { id: "own-event", organization_id: "org-own", ...stamps(NEW) },
    { id: "foreign-event", organization_id: "org-other", ...stamps(NEW) },
    { id: "not-invited", organization_id: "org-other", ...stamps(NEW) },
  ];
  tables.event_participants = [
    { id: "own-part", event_id: "own-event", school_member_id: "my-student", ...stamps(NEW) },
    { id: "my-part", event_id: "foreign-event", school_member_id: "me-there", ...stamps(NEW) },
    { id: "classmate-part", event_id: "foreign-event", school_member_id: "classmate", ...stamps(NEW) },
    { id: "classmate-other", event_id: "not-invited", school_member_id: "classmate", ...stamps(NEW) },
  ];
  tables.orders = [
    { id: "own-order", school_id: "own-s", school_member_id: "my-student", ...stamps(NEW) },
    { id: "my-order", school_id: "foreign-s", school_member_id: "me-there", ...stamps(NEW) },
    { id: "classmate-order", school_id: "foreign-s", school_member_id: "classmate", ...stamps(NEW) },
  ];
  tables.order_items = [
    { id: "own-item", order_id: "own-order", ...stamps(NEW) },
    { id: "my-item", order_id: "my-order", ...stamps(NEW) },
    { id: "classmate-item", order_id: "classmate-order", ...stamps(NEW) },
  ];

  const { changes } = await ownerSync(tables, { fullMemberPull: true });

  assertEquals(ids(changes.training_sessions), ["foreign-session", "own-session"]);
  assertEquals(ids(changes.attendance_records), ["my-att", "own-att"]);
  assertEquals(ids(changes.events), ["foreign-event", "own-event"]);
  assertEquals(ids(changes.event_participants), ["my-part", "own-part"]);
  assertEquals(ids(changes.orders), ["my-order", "own-order"]);
  assertEquals(ids(changes.order_items), ["my-item", "own-item"]);
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

Deno.test("an owner's answer, order and join request in another school reach that school", async () => {
  const tables = ownerWhoTrainsElsewhere();
  tables.events = [
    { id: "own-event", organization_id: "org-own", ...stamps(OLD) },
    { id: "foreign-event", organization_id: "org-other", ...stamps(OLD) },
  ];
  tables.orders = [{ id: "own-order", school_id: "own-s", ...stamps(OLD) }];
  const writes: { op: string; table: string; rows: Row[] }[] = [];

  await syncOrganization({
    supabaseClient: tableClient(tables, writes),
    userId: "me",
    lastPulledAt: LAST_PULLED,
    migratedTables: [],
    columnMigratedTables: [],
    changes: {
      event_participants: {
        created: [],
        updated: [
          { id: "my-answer", event_id: "foreign-event", school_member_id: "me-there", status: "absent", takes_exam: true },
          { id: "student-answer", event_id: "own-event", school_member_id: "my-student", status: "attending", takes_exam: true },
        ],
        deleted: [],
      },
      orders: {
        created: [{ id: "my-order", school_id: "foreign-s", school_member_id: "me-there", event_id: "x" }],
        updated: [],
        deleted: [],
      },
      order_items: {
        created: [
          { id: "my-item", order_id: "my-order" },
          { id: "own-item", order_id: "own-order" },
        ],
        updated: [],
        deleted: [],
      },
      school_join_requests: {
        created: [
          { id: "my-request", school_id: "other-s", user_id: "me", status: "pending" },
          { id: "forged", school_id: "other-s", user_id: "someone", status: "pending" },
        ],
        updated: [],
        deleted: [],
      },
    },
  } as any);

  const written = (table: string) =>
    writes.filter((w) => w.table === table).flatMap((w) => w.rows).map((r) => r.id ?? r.status);

  // Event answers: the owner's own event as the owner (takes_exam kept), the
  // other school's as a student (takes_exam is the instructor's)
  const answers = writes.filter((w) => w.table === "event_participants").flatMap((w) => w.rows);
  assertEquals(answers.map((r) => [r.id, r.status, "takes_exam" in r]), [
    ["student-answer", "attending", true],
    ["my-answer", "absent", false],
  ]);
  assertEquals(writes.filter((w) => w.table === "orders").flatMap((w) => w.rows), [
    { id: "my-order", school_id: "foreign-s", school_member_id: "me-there" },
  ]);
  assertEquals(written("order_items").sort(), ["my-item", "own-item"]);
  assertEquals(written("school_join_requests"), ["my-request"]);
});

Deno.test("an owner's push splits student rows of other schools from their organization's", () => {
  const owned = {
    schoolIds: new Set(["own-s"]),
    orderIds: new Set(["own-order"]),
    eventIds: new Set(["own-event"]),
  };
  const { own, student } = splitStudentChanges(
    {
      schools: { created: [{ id: "own-s" }], updated: [], deleted: [] },
      orders: {
        created: [{ id: "a", school_id: "own-s" }, { id: "b", school_id: "foreign-s" }],
        updated: [],
        deleted: ["c"],
      },
      event_participants: {
        created: [],
        updated: [{ id: "p1", event_id: "own-event" }, { id: "p2", event_id: "foreign-event" }],
        deleted: [],
      },
    },
    owned,
  );

  assertEquals(own.schools.created, [{ id: "own-s" }]);
  assertEquals(own.orders, { created: [{ id: "a", school_id: "own-s" }], updated: [], deleted: ["c"] });
  assertEquals(student.orders, { created: [{ id: "b", school_id: "foreign-s" }], updated: [], deleted: [] });
  assertEquals(own.event_participants.updated, [{ id: "p1", event_id: "own-event" }]);
  assertEquals(student.event_participants.updated, [{ id: "p2", event_id: "foreign-event" }]);
  assertEquals(student.schools, undefined);
});
