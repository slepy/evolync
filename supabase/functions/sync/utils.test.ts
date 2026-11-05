// Run: supabase/functions/run-deno-tests.sh (or `deno test supabase/functions`)
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { convertToSupabaseRecord, convertToWatermelonRecord } from "./utils.ts";

Deno.test("locked_at: a lock is sent as a timestamp, an unlock as null", () => {
  const at = Date.UTC(2026, 10, 3);
  assertEquals(convertToSupabaseRecord({ id: "c1", locked_at: at }, "payment_cycles").locked_at, new Date(at).toISOString());
  assertEquals(convertToSupabaseRecord({ id: "c1", locked_at: null }, "payment_cycles").locked_at, null);
});

Deno.test("locked_at: a row from a build without the column leaves it out", () => {
  assertEquals("locked_at" in convertToSupabaseRecord({ id: "c1" }, "payment_cycles"), false);
});

Deno.test("locked_at: pulled as milliseconds, null stays null", () => {
  const iso = "2026-11-03T00:00:00.000Z";
  assertEquals(convertToWatermelonRecord({ id: "c1", locked_at: iso }, "payment_cycles").locked_at, Date.parse(iso));
  assertEquals(convertToWatermelonRecord({ id: "c1", locked_at: null }, "payment_cycles").locked_at, null);
});
