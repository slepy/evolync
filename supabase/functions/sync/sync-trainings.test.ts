// Run: supabase/functions/run-deno-tests.sh (or `deno test supabase/functions`)
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  isTrainingVisibleToMember,
  pullTrainingsChanges,
  pullTrainingsForMember,
  pushTrainingsChanges,
  toSupabaseTrainingRecord,
  toWatermelonTrainingRecord,
} from "./sync-trainings.ts";

const ORG = "org-1";
const OTHER_ORG = "org-2";

type Call = { op: string; args: any[] };

/**
 * Minimal PostgREST fake: tables of rows; select queries filter by
 * eq/is/gte/in (dotted columns read embedded objects); writes are recorded.
 */
function fakeClient(tables: Record<string, any[]> = {}) {
  const writes: { table: string; op: string; payload: any; calls: Call[] }[] = [];

  const read = (row: any, col: string) =>
    col.split(".").reduce((value, key) => (value == null ? value : value[key]), row);

  const from = (table: string) => {
    const calls: Call[] = [];
    let write: { op: string; payload: any } | null = null;
    const builder: any = {
      select: (...args: any[]) => (calls.push({ op: "select", args }), builder),
      eq: (...args: any[]) => (calls.push({ op: "eq", args }), builder),
      is: (...args: any[]) => (calls.push({ op: "is", args }), builder),
      gte: (...args: any[]) => (calls.push({ op: "gte", args }), builder),
      in: (...args: any[]) => (calls.push({ op: "in", args }), builder),
      upsert: (payload: any) => ((write = { op: "upsert", payload }), builder),
      update: (payload: any) => ((write = { op: "update", payload }), builder),
      then: (resolve: (v: unknown) => void) => {
        if (write) {
          writes.push({ table, ...write, calls });
          return resolve({ data: null, error: null });
        }
        let data = tables[table] ?? [];
        for (const { op, args } of calls) {
          const [col, val] = args;
          if (op === "eq") data = data.filter((r) => read(r, col) === val);
          if (op === "is") data = data.filter((r) => (read(r, col) ?? null) === val);
          if (op === "gte") data = data.filter((r) => read(r, col) >= val);
          if (op === "in") data = data.filter((r) => val.includes(read(r, col)));
        }
        resolve({ data, error: null });
      },
    };
    return builder;
  };

  return { client: { from }, writes };
}

const ctx = (client: any, changes: any = {}, extra: any = {}) => ({
  supabaseClient: client,
  userId: "owner",
  changes,
  lastPulledAt: 0,
  ...extra,
});

const DAY = Date.UTC(2099, 0, 5);

Deno.test("record conversion maps days to SQL dates and JSON columns to jsonb", () => {
  const row = toSupabaseTrainingRecord(
    {
      id: "s1",
      organization_id: ORG,
      start_date: DAY,
      end_date: Date.UTC(2099, 1, 5),
      rules: '[{"weekday":1,"frequency":"weekly","startTime":"18:00","endTime":"19:00"}]',
      invitee_ids: '["m1"]',
      created_at: 0,
      _status: "created",
      _changed: "",
    },
    "training_series",
  );
  assertEquals(row.start_date, "2099-01-05");
  assertEquals(row.end_date, "2099-02-05");
  assertEquals(row.rules[0].weekday, 1);
  assertEquals(row.invitee_ids, ["m1"]);
  assert(!("_status" in row) && !("created_at" in row));

  const back = toWatermelonTrainingRecord(
    { ...row, created_at: "2099-01-01T00:00:00Z", updated_at: "2099-01-01T00:00:00Z" },
    "training_series",
  );
  assertEquals(back.start_date, DAY);
  assertEquals(JSON.parse(back.rules)[0].frequency, "weekly");
  assertEquals(back.invitee_ids, '["m1"]');

  const training = toSupabaseTrainingRecord({ id: "t1", date: DAY, start_time: "18:00" }, "trainings");
  assertEquals(training.date, "2099-01-05");
});

Deno.test("push keeps rows inside the caller's organization only", async () => {
  const { client, writes } = fakeClient({
    trainings: [{ id: "foreign", organization_id: OTHER_ORG }],
    schools: [
      { id: "school-own", organization_id: ORG },
      { id: "school-foreign", organization_id: OTHER_ORG },
    ],
  });

  await pushTrainingsChanges(
    ctx(client, {
      trainings: {
        created: [
          { id: "t1", organization_id: ORG, date: DAY },
          { id: "t-school", organization_id: ORG, school_id: "school-own", date: DAY },
          // school of another organization: rejected
          { id: "t-foreign-school", organization_id: ORG, school_id: "school-foreign", date: DAY },
          { id: "t2", organization_id: OTHER_ORG, date: DAY },
          // id collision with another organization's row: never overwritten
          { id: "foreign", organization_id: ORG, date: DAY },
        ],
        updated: [],
        deleted: ["t9"],
      },
    }),
    ORG,
  );

  const upsert = writes.find((w) => w.table === "trainings" && w.op === "upsert");
  assertEquals(upsert?.payload.map((r: any) => r.id), ["t1", "t-school"]);

  const del = writes.find((w) => w.table === "trainings" && w.op === "update");
  assert(del, "soft delete issued");
  assert(
    del.calls.some((c) => c.op === "eq" && c.args[0] === "organization_id" && c.args[1] === ORG),
    "soft delete is scoped to the organization",
  );
});

Deno.test("push keeps a series' previous_series_id only inside the organization", async () => {
  const { client, writes } = fakeClient({
    training_series: [
      { id: "s-own", organization_id: ORG },
      { id: "s-foreign", organization_id: OTHER_ORG },
    ],
  });
  const series = (id: string, previous: string | null) => ({
    id, organization_id: ORG, previous_series_id: previous, rules: "[]", invitee_ids: "[]",
  });

  await pushTrainingsChanges(
    ctx(client, {
      training_series: {
        created: [
          series("s-batch", null),
          series("s-after-batch", "s-batch"), // parent pushed in the same batch
          series("s-after-own", "s-own"), // parent already on the server
          series("s-after-foreign", "s-foreign"), // another organization's series: link dropped
          series("s-after-missing", "s-missing"), // unknown parent: link dropped
        ],
        updated: [],
        deleted: [],
      },
    }),
    ORG,
  );

  const upsert = writes.find((w) => w.table === "training_series" && w.op === "upsert");
  assertEquals(
    Object.fromEntries(upsert?.payload.map((r: any) => [r.id, r.previous_series_id])),
    {
      "s-batch": null,
      "s-after-batch": "s-batch",
      "s-after-own": "s-own",
      "s-after-foreign": null,
      "s-after-missing": null,
    },
  );
});

Deno.test("push accepts invitees only for the organization's trainings", async () => {
  const { client, writes } = fakeClient({
    trainings: [
      { id: "t1", organization_id: ORG },
      { id: "tx", organization_id: OTHER_ORG },
    ],
    training_invitees: [
      { id: "i-own", training_id: "t1" },
      { id: "i-foreign", training_id: "tx" },
    ],
    schools: [
      { id: "school-own", organization_id: ORG },
      { id: "school-foreign", organization_id: OTHER_ORG },
    ],
    school_members: [
      { id: "m1", school_id: "school-own" },
      { id: "m-foreign", school_id: "school-foreign" },
    ],
  });

  await pushTrainingsChanges(
    ctx(client, {
      training_invitees: {
        created: [
          { id: "i1", training_id: "t1", school_member_id: "m1" },
          { id: "i2", training_id: "tx", school_member_id: "m1" },
          // another organization's member cannot be invited
          { id: "i3", training_id: "t1", school_member_id: "m-foreign" },
        ],
        updated: [],
        deleted: ["i-own", "i-foreign"],
      },
    }),
    ORG,
  );

  const upsert = writes.find((w) => w.table === "training_invitees" && w.op === "upsert");
  assertEquals(upsert?.payload.map((r: any) => r.id), ["i1"]);
  const del = writes.find((w) => w.table === "training_invitees" && w.op === "update");
  const ids = del?.calls.find((c) => c.op === "in")?.args[1];
  assertEquals(ids, ["i-own"]);
});

Deno.test("pull returns the organization's rows, scoping invitees through their training", async () => {
  const live = { created_at: "2099-01-01T00:00:00Z", updated_at: "2099-01-01T00:00:00Z", deleted_at: null };
  const { client } = fakeClient({
    training_series: [
      { id: "s1", organization_id: ORG, rules: [], invitee_ids: [], start_date: "2099-01-01", end_date: "2099-02-01", ...live },
    ],
    trainings: [
      { id: "t1", organization_id: ORG, date: "2099-01-05", ...live },
      { id: "t2", organization_id: OTHER_ORG, date: "2099-01-05", ...live },
    ],
    training_invitees: [
      { id: "i1", training_id: "t1", trainings: { organization_id: ORG }, ...live },
      { id: "i2", training_id: "t2", trainings: { organization_id: OTHER_ORG }, ...live },
    ],
  });

  const pulled = await pullTrainingsChanges(ctx(client), ORG);
  assertEquals(pulled.trainings.created.map((r) => r.id), ["t1"]);
  assertEquals(pulled.trainings.created[0].date, DAY);
  assertEquals(pulled.training_series.created[0].rules, "[]");
  assertEquals(pulled.training_invitees.created.map((r) => r.id), ["i1"]);
  assert(!("trainings" in pulled.training_invitees.created[0]), "embedded join is stripped");
});

Deno.test("incremental pull splits created/updated/deleted; a migrated client gets everything", async () => {
  const lastPulledAt = Date.parse("2099-01-10T00:00:00Z");
  const { client } = fakeClient({
    training_series: [],
    training_invitees: [],
    trainings: [
      { id: "old", organization_id: ORG, created_at: "2099-01-01T00:00:00Z", updated_at: "2099-01-01T00:00:00Z", deleted_at: null },
      { id: "new", organization_id: ORG, created_at: "2099-01-11T00:00:00Z", updated_at: "2099-01-11T00:00:00Z", deleted_at: null },
      { id: "edited", organization_id: ORG, created_at: "2099-01-01T00:00:00Z", updated_at: "2099-01-11T00:00:00Z", deleted_at: null },
      { id: "gone", organization_id: ORG, created_at: "2099-01-01T00:00:00Z", updated_at: "2099-01-11T00:00:00Z", deleted_at: "2099-01-11T00:00:00Z" },
    ],
  });

  const incremental = await pullTrainingsChanges(ctx(client, {}, { lastPulledAt }), ORG);
  assertEquals(incremental.trainings.created.map((r) => r.id), ["new"]);
  assertEquals(incremental.trainings.updated.map((r) => r.id), ["edited"]);
  assertEquals(incremental.trainings.deleted, ["gone"]);

  const migrated = await pullTrainingsChanges(
    ctx(client, {}, { lastPulledAt, migratedTables: ["trainings"] }),
    ORG,
  );
  assertEquals(migrated.trainings.created.map((r) => r.id).sort(), ["edited", "new", "old"]);
  assertEquals(migrated.trainings.deleted, []);
});

// ---------------------------------------------------------------------------
// Student / member pull
// ---------------------------------------------------------------------------

const SCOPE = { memberIds: ["me-a"], schoolIds: ["school-a"], organizationIds: [ORG] };
const ts = (iso: string) => `2099-01-${iso}T00:00:00Z`;
const tr = (id: string, extra: Record<string, unknown>) => ({
  id,
  organization_id: ORG,
  school_id: null,
  date: "2099-02-01",
  created_at: ts("01"),
  updated_at: ts("01"),
  deleted_at: null,
  ...extra,
});

const memberFixture = (): Record<string, any[]> => ({
  trainings: [
    tr("org", { visibility: "organization" }),
    tr("school-a", { visibility: "school", school_id: "school-a" }),
    tr("school-b", { visibility: "school", school_id: "school-b" }),
    tr("private-me", { visibility: "whitelist" }),
    tr("private-other", { visibility: "whitelist" }),
    tr("other-org", { visibility: "organization", organization_id: OTHER_ORG }),
    tr("deleted", { visibility: "organization", deleted_at: ts("02"), updated_at: ts("02") }),
  ],
  training_invitees: [
    { id: "inv-me", training_id: "private-me", school_member_id: "me-a", created_at: ts("01"), updated_at: ts("01"), deleted_at: null },
    { id: "inv-other", training_id: "private-other", school_member_id: "someone", created_at: ts("01"), updated_at: ts("01"), deleted_at: null },
  ],
});

Deno.test("member first pull: organization, own school and invited trainings only", async () => {
  const { client } = fakeClient(memberFixture());
  const { trainings, training_invitees } = await pullTrainingsForMember(ctx(client), SCOPE);
  assertEquals(trainings.created.map((r) => r.id).sort(), ["org", "private-me", "school-a"]);
  assertEquals(training_invitees.created.map((r) => r.id), ["inv-me"], "only the member's own invitations");
  assertEquals(trainings.updated, []);
  assertEquals(trainings.deleted, []);
});

Deno.test("member pull never returns trainings outside the audience, per visibility", () => {
  const invited = new Set(["private-me"]);
  const visible = (row: any) => isTrainingVisibleToMember(row, SCOPE, invited);
  assert(visible(tr("x", { visibility: "organization" })));
  assert(!visible(tr("x", { visibility: "organization", organization_id: OTHER_ORG })));
  assert(visible(tr("x", { visibility: "school", school_id: "school-a" })));
  assert(!visible(tr("x", { visibility: "school", school_id: "school-b" })));
  assert(!visible(tr("x", { visibility: "school", school_id: null })));
  assert(visible(tr("private-me", { visibility: "whitelist" })));
  assert(!visible(tr("private-other", { visibility: "whitelist" })));
  assert(!visible(tr("org", { visibility: "organization", deleted_at: ts("02") })));
});

Deno.test("member incremental pull: audience changes and removed invitations become deletions", async () => {
  const lastPulledAt = Date.parse(ts("10"));
  const fixture = memberFixture();
  fixture.trainings = [
    // moved from organization to school B → no longer visible
    tr("moved", { visibility: "school", school_id: "school-b", updated_at: ts("11") }),
    // cancelled, still visible → update
    tr("org", { visibility: "organization", status: "cancelled", updated_at: ts("11") }),
    // new school-A training → created
    tr("new", { visibility: "school", school_id: "school-a", created_at: ts("11"), updated_at: ts("11") }),
    // untouched training whose invitation was revoked
    tr("revoked", { visibility: "whitelist" }),
    // untouched training I was just invited to
    tr("invited", { visibility: "whitelist" }),
    tr("untouched", { visibility: "organization" }),
  ];
  fixture.training_invitees = [
    { id: "inv-revoked", training_id: "revoked", school_member_id: "me-a", created_at: ts("01"), updated_at: ts("11"), deleted_at: ts("11") },
    { id: "inv-new", training_id: "invited", school_member_id: "me-a", created_at: ts("11"), updated_at: ts("11"), deleted_at: null },
  ];
  const { client } = fakeClient(fixture);
  const { trainings, training_invitees } = await pullTrainingsForMember(ctx(client, {}, { lastPulledAt }), SCOPE);
  assertEquals(training_invitees.created.map((r) => r.id), ["inv-new"]);
  assertEquals(training_invitees.deleted, ["inv-revoked"]);
  assertEquals(trainings.created.map((r) => r.id).sort(), ["invited", "new"]);
  assertEquals(trainings.updated.map((r) => r.id), ["org"]);
  assertEquals(trainings.deleted.sort(), ["moved", "revoked"]);
});

Deno.test("a new membership triggers a full member pull", async () => {
  const { client } = fakeClient(memberFixture());
  const { trainings } = await pullTrainingsForMember(
    ctx(client, {}, { lastPulledAt: Date.parse(ts("20")) }),
    { ...SCOPE, newMembership: true },
  );
  assertEquals(trainings.created.map((r) => r.id).sort(), ["org", "private-me", "school-a"]);
});
