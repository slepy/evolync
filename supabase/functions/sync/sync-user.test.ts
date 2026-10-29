// Run: supabase/functions/run-deno-tests.sh (or `deno test supabase/functions`)
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  MEMBER_SCHOOL_TABLES,
  ORGANIZATION_PUSH_TABLES,
  chunkIds,
  columnMigratedTables,
  fetchTableChangesIn,
  membershipChangedSince,
  ownMembershipPush,
  studentOrderPush,
  studentParticipantPush,
} from "./utils.ts";

Deno.test("a student's school_members push keeps only their own rows, without the fee", () => {
  const records = [
    { id: "m1", user_id: "u1", display_name: "Ala", payment_amount: 0, payment_currency: "PLN" },
    { id: "m2", user_id: "u2", display_name: "Ola", payment_amount: 100, payment_currency: "EUR" },
    { id: "m3", user_id: "u1", display_name: "Ala", payment_amount: null, payment_currency: null },
  ];

  assertEquals(ownMembershipPush(records, "u1"), [
    { id: "m1", user_id: "u1", display_name: "Ala" },
    { id: "m3", user_id: "u1", display_name: "Ala" },
  ]);
});

Deno.test("tables that gained columns in a client migration are pulled in full", () => {
  assertEquals(columnMigratedTables(null), []);
  assertEquals(
    columnMigratedTables({
      columns: [
        { table: "events", columns: ["type_id"] },
        { table: "events", columns: ["other"] },
        { table: "schools", columns: [] },
      ],
    }),
    ["events"],
  );
});

Deno.test("a student's event_participants push drops takes_exam", () => {
  assertEquals(
    studentParticipantPush([
      { id: "p1", status: "attending", takes_exam: true },
      { id: "p2", status: "absent" },
    ]),
    [
      { id: "p1", status: "attending" },
      { id: "p2", status: "absent" },
    ],
  );
});

Deno.test("a student's orders push drops event_id", () => {
  assertEquals(studentOrderPush([{ id: "o1", status: "placed", event_id: "e1" }]), [
    { id: "o1", status: "placed" },
  ]);
});

Deno.test("an owner pushes event types and events before the orders that reference them", () => {
  const at = (table: string) => ORGANIZATION_PUSH_TABLES.indexOf(table);
  assertEquals(at("event_types") < at("events"), true);
  assertEquals(at("events") < at("orders"), true);
  assertEquals(at("orders") < at("order_items"), true);
  assertEquals(at("school_members") < at("event_participants"), true);
});

Deno.test("a membership created or changed since the last pull pulls the school tables in full", () => {
  const lastPulledAt = Date.parse("2026-10-20T10:00:00Z");
  const old = { created_at: "2026-09-01T10:00:00Z", updated_at: "2026-09-01T10:00:00Z" };

  assertEquals(membershipChangedSince([old], lastPulledAt), false);
  // Approved as a new member.
  assertEquals(
    membershipChangedSince([old, { created_at: "2026-10-21T08:00:00Z", updated_at: "2026-10-21T08:00:00Z" }], lastPulledAt),
    true,
  );
  // An offline member activated with the user's account: an old row, updated now.
  assertEquals(
    membershipChangedSince([{ created_at: "2026-09-01T10:00:00Z", updated_at: "2026-10-21T08:00:00Z" }], lastPulledAt),
    true,
  );
  // The first pull is already full.
  assertEquals(membershipChangedSince([{ created_at: "2026-10-21T08:00:00Z" }], 0), false);
  assertEquals(membershipChangedSince([], lastPulledAt), false);
});

Deno.test("the school tables pulled in full cover the newly visible school's data", () => {
  for (const table of ["schools", "school_settings", "school_members", "payment_cycles", "events", "products"]) {
    assertEquals(MEMBER_SCHOOL_TABLES.includes(table), true, table);
  }
});

Deno.test("ids are split into parts of at most 100", () => {
  const ids = Array.from({ length: 250 }, (_, i) => `s${i}`);
  assertEquals(chunkIds(ids).map((part) => part.length), [100, 100, 50]);
  assertEquals(chunkIds([]), []);
});

Deno.test("a pull over many session ids filters each chunk and merges the changes", async () => {
  const ids = Array.from({ length: 150 }, (_, i) => `s${i}`);
  const calls: Array<Array<[string, unknown]>> = [];
  const fetchTableChanges = async (_table: string, filterFn?: (q: any) => any) => {
    const filters: Array<[string, unknown]> = [];
    const query = { in: (column: string, values: unknown) => (filters.push([column, values]), query) };
    filterFn?.(query);
    calls.push(filters);
    const part = filters[0][1] as string[];
    return { created: [{ id: part[0] }], updated: [], deleted: [part[part.length - 1]] };
  };

  const result = await fetchTableChangesIn(fetchTableChanges, "attendance_records", "training_session_id", ids, (q) =>
    q.in("school_member_id", ["m1"]),
  );

  assertEquals(calls.length, 2);
  assertEquals(calls[1][0], ["training_session_id", ids.slice(100)]);
  assertEquals(calls[1][1], ["school_member_id", ["m1"]]);
  assertEquals(result, { created: [{ id: "s0" }, { id: "s100" }], updated: [], deleted: ["s99", "s149"] });
});
