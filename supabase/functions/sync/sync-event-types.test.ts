// Run: supabase/functions/run-deno-tests.sh (or `deno test supabase/functions`)
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  eventTypeChanges,
  ownEventTypesPush,
  pullEventTypesForMember,
  pullEventTypesForOrganization,
  referencedTypeIds,
  typesOfOwnOrganization,
} from "./sync-event-types.ts";

const ORG = "org-1";
const T0 = Date.UTC(2099, 0, 1);
const LAST = Date.UTC(2099, 0, 10);
const LATER = Date.UTC(2099, 0, 15);

const iso = (ms: number) => new Date(ms).toISOString();

const type = (id: string, created: number, updated = created, deleted?: number, org = ORG) => ({
  id,
  organization_id: org,
  name: `Type ${id}`,
  created_by: "owner",
  created_at: iso(created),
  updated_at: iso(updated),
  deleted_at: deleted ? iso(deleted) : null,
});

/** Minimal PostgREST fake: select queries filter by eq/is/gte/in. */
function fakeClient(tables: Record<string, any[]>) {
  const from = (table: string) => {
    const calls: { op: string; args: any[] }[] = [];
    const builder: any = {
      select: () => builder,
      eq: (...args: any[]) => (calls.push({ op: "eq", args }), builder),
      is: (...args: any[]) => (calls.push({ op: "is", args }), builder),
      gte: (...args: any[]) => (calls.push({ op: "gte", args }), builder),
      in: (...args: any[]) => (calls.push({ op: "in", args }), builder),
      then: (resolve: (v: unknown) => void) => {
        let data = tables[table] ?? [];
        for (const { op, args } of calls) {
          const [col, val] = args;
          if (op === "eq") data = data.filter((r) => r[col] === val);
          if (op === "is") data = data.filter((r) => (r[col] ?? null) === val);
          if (op === "gte") data = data.filter((r) => r[col] >= val);
          if (op === "in") data = data.filter((r) => val.includes(r[col]));
        }
        resolve({ data, error: null });
      },
    };
    return builder;
  };
  return { from };
}

const ids = (rows: any[]) => rows.map((r) => r.id).sort();

Deno.test("referencedTypeIds keeps distinct non-empty ids", () => {
  assertEquals(referencedTypeIds([{ type_id: "a" }, { type_id: null }, { type_id: "a" }, { type_id: "b" }, {}]), [
    "a",
    "b",
  ]);
});

Deno.test("a first pull sends live types as created, deleted ones only when kept", () => {
  const rows = [type("a", T0), type("b", T0, LATER, LATER), type("c", T0, LATER, LATER)];
  const changes = eventTypeChanges(rows, 0, true, { keepDeleted: new Set(["c"]) });
  assertEquals(ids(changes.created), ["a", "c"]);
  assertEquals(changes.updated, []);
  assertEquals(changes.deleted, []);
});

Deno.test("a later pull sends new, renamed and deleted types; deletes stay updates", () => {
  const rows = [
    type("old", T0), // unchanged
    type("new", LATER),
    type("renamed", T0, LATER),
    type("gone", T0, LATER, LATER),
    type("blink", LATER, LATER, LATER), // created and deleted since the last pull
  ];
  const changes = eventTypeChanges(rows, LAST, false);
  assertEquals(ids(changes.created), ["new"]);
  assertEquals(ids(changes.updated), ["gone", "renamed"]);
  assertEquals(changes.deleted, []);
  assertEquals(typeof changes.updated.find((r) => r.id === "gone").deleted_at, "number");
});

Deno.test("a later pull always sends forced types (a newly visible event's type)", () => {
  const changes = eventTypeChanges([type("old", T0)], LAST, false, { force: new Set(["old"]) });
  assertEquals(ids(changes.updated), ["old"]);
});

Deno.test("the organization pull returns only its own types; a first pull keeps deleted types in use", async () => {
  const client = fakeClient({
    event_types: [type("a", T0), type("used", T0, LATER, LATER), type("unused", T0, LATER, LATER), type("x", T0, T0, undefined, "org-2")],
    events: [{ id: "e1", type_id: "used", deleted_at: null }],
  });
  const first = await pullEventTypesForOrganization({ supabaseClient: client, lastPulledAt: 0 }, ORG);
  assertEquals(ids(first.created), ["a", "used"]);

  const later = await pullEventTypesForOrganization({ supabaseClient: client, lastPulledAt: LAST }, ORG);
  assertEquals(ids(later.created), []);
  assertEquals(ids(later.updated), ["unused", "used"]);
});

Deno.test("a schema migration that adds event_types pulls them as a first sync", async () => {
  const client = fakeClient({ event_types: [type("a", T0)], events: [] });
  const changes = await pullEventTypesForOrganization(
    { supabaseClient: client, lastPulledAt: LAST, migratedTables: ["event_types"] },
    ORG,
  );
  assertEquals(ids(changes.created), ["a"]);
});

Deno.test("a member pulls only the types of their events, and those of newly pulled events", async () => {
  const client = fakeClient({
    event_types: [type("camp", T0), type("seminar", T0), type("other", T0)],
    events: [
      { id: "e1", type_id: "camp", organization_id: ORG, deleted_at: null },
      { id: "e2", type_id: "seminar", organization_id: ORG, deleted_at: null },
      { id: "e3", type_id: "other", organization_id: ORG, deleted_at: null }, // not the member's
      { id: "e4", type_id: null, organization_id: ORG, deleted_at: null },
    ],
  });

  const first = await pullEventTypesForMember({ supabaseClient: client, lastPulledAt: 0 }, ["e1", "e2", "e4"], []);
  assertEquals(ids(first.created), ["camp", "seminar"]);

  const later = await pullEventTypesForMember({ supabaseClient: client, lastPulledAt: LAST }, ["e1", "e2"], [
    { id: "e2", type_id: "seminar" },
  ]);
  assertEquals(ids(later.created), []);
  assertEquals(ids(later.updated), ["seminar"]);

  const none = await pullEventTypesForMember({ supabaseClient: client, lastPulledAt: LAST }, [], []);
  assertEquals(none, { created: [], updated: [], deleted: [] });
});

Deno.test("an owner's push keeps only their own organization's types", () => {
  const rows = [type("a", T0), type("b", T0, T0, undefined, "org-2")];
  assertEquals(ids(ownEventTypesPush(rows, ORG)), ["a"]);
});

Deno.test("a member never receives another organization's type, even when an event points at it", async () => {
  const client = fakeClient({
    event_types: [type("camp", T0), type("foreign", T0, T0, undefined, "org-2")],
    events: [
      { id: "e1", type_id: "camp", organization_id: ORG, deleted_at: null },
      { id: "e2", type_id: "foreign", organization_id: ORG, deleted_at: null },
    ],
  });
  const changes = await pullEventTypesForMember({ supabaseClient: client, lastPulledAt: 0 }, ["e1", "e2"], []);
  assertEquals(ids(changes.created), ["camp"]);
  assertEquals(
    ids(typesOfOwnOrganization([type("a", T0), type("b", T0, T0, undefined, "org-2")], [
      { type_id: "a", organization_id: ORG },
      { type_id: "b", organization_id: ORG },
    ])),
    ["a"],
  );
});
