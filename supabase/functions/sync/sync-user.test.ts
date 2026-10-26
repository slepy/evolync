// Run: supabase/functions/run-deno-tests.sh (or `deno test supabase/functions`)
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  MEMBER_SCHOOL_TABLES,
  ORGANIZATION_PUSH_TABLES,
  columnMigratedTables,
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
