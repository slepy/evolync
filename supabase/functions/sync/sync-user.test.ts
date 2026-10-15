// Run: supabase/functions/run-deno-tests.sh (or `deno test supabase/functions`)
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { columnMigratedTables, ownMembershipPush } from "./utils.ts";

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
