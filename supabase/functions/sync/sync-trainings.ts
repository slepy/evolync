/**
 * Sync logic for PLANNED TRAININGS (training_series, trainings, training_invitees).
 *
 * - Organization owners push and pull their organization's rows. The sync
 *   function runs with the service role, so pushes are scoped to the caller's
 *   organization here (RLS does not guard them).
 * - Students pull, read-only, the trainings they are in the audience of
 *   (organization, their school, or invited) — see pullTrainingsForMember.
 *
 * `rules` / `invitee_ids` are JSON strings in WatermelonDB and jsonb on the
 * server; they are converted in both directions.
 */

import { convertToSupabaseRecord, convertToWatermelonRecord, describeError } from "./utils.ts";

type TableChanges = { created: any[]; updated: any[]; deleted: string[] };

export interface SyncTrainingsContext {
  supabaseClient: any;
  userId: string;
  changes: Record<string, TableChanges>;
  lastPulledAt: number;
  migratedTables?: string[];
}

export const TRAINING_TABLES = ["training_series", "trainings", "training_invitees"] as const;
type TrainingTable = (typeof TRAINING_TABLES)[number];

const JSON_COLUMNS: Record<TrainingTable, string[]> = {
  training_series: ["rules", "invitee_ids"],
  trainings: [],
  training_invitees: [],
};

const CHUNK = 100;
const empty = (): TableChanges => ({ created: [], updated: [], deleted: [] });

const chunks = <T>(items: T[]): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += CHUNK) out.push(items.slice(i, i + CHUNK));
  return out;
};

const parseJson = (value: unknown, fallback: unknown) => {
  if (typeof value !== "string") return value ?? fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export function toSupabaseTrainingRecord(record: any, table: TrainingTable): any {
  const row = convertToSupabaseRecord(record, table);
  for (const column of JSON_COLUMNS[table]) {
    if (column in row) row[column] = parseJson(row[column], []);
  }
  return row;
}

export function toWatermelonTrainingRecord(row: any, table: TrainingTable): any {
  const { trainings: _embedded, ...plain } = row;
  const record = convertToWatermelonRecord(plain, table);
  for (const column of JSON_COLUMNS[table]) {
    if (column in record && typeof record[column] !== "string") {
      record[column] = JSON.stringify(record[column] ?? []);
    }
  }
  return record;
}

// =============================================================================
// PUSH (organization owner)
// =============================================================================

/** Ids among `ids` that already exist on the server under ANOTHER organization. */
async function foreignIds(
  supabaseClient: any,
  table: "training_series" | "trainings",
  ids: string[],
  organizationId: string,
): Promise<Set<string>> {
  const foreign = new Set<string>();
  for (const part of chunks(ids)) {
    const { data, error } = await supabaseClient.from(table).select("id, organization_id").in("id", part);
    if (error) throw new Error(`Failed to verify ${table}: ${describeError(error)}`);
    for (const row of data || []) {
      if (row.organization_id !== organizationId) foreign.add(row.id);
    }
  }
  return foreign;
}

/** Ids among `ids` that exist on the server under the organization. */
async function ownIds(
  supabaseClient: any,
  table: "training_series" | "trainings",
  ids: string[],
  organizationId: string,
): Promise<Set<string>> {
  const own = new Set<string>();
  for (const part of chunks([...new Set(ids)])) {
    const { data, error } = await supabaseClient
      .from(table)
      .select("id")
      .in("id", part)
      .eq("organization_id", organizationId);
    if (error) throw new Error(`Failed to verify ${table}: ${describeError(error)}`);
    for (const row of data || []) own.add(row.id);
  }
  return own;
}

const ownTrainingIds = (supabaseClient: any, ids: string[], organizationId: string) =>
  ownIds(supabaseClient, "trainings", ids, organizationId);

/**
 * A series may only continue a series of the same organization: one pushed in
 * this batch or already on the server. Any other link is dropped.
 */
async function scopePreviousSeries(supabaseClient: any, rows: any[], organizationId: string): Promise<void> {
  const linked = rows.map((r) => r.previous_series_id).filter(Boolean);
  if (linked.length === 0) return;
  const allowed = new Set<string>(rows.map((r) => r.id));
  const existing = await ownIds(supabaseClient, "training_series", linked.filter((id) => !allowed.has(id)), organizationId);
  for (const row of rows) {
    if (row.previous_series_id && !allowed.has(row.previous_series_id) && !existing.has(row.previous_series_id)) {
      console.warn(`[SYNC:TRAININGS] Dropped previous_series_id outside organization ${organizationId}`);
      row.previous_series_id = null;
    }
  }
}

/** Every school id of the organization (soft-deleted ones included). */
async function organizationSchoolIds(supabaseClient: any, organizationId: string): Promise<Set<string>> {
  const { data, error } = await supabaseClient.from("schools").select("id").eq("organization_id", organizationId);
  if (error) throw new Error(`Failed to verify schools: ${describeError(error)}`);
  return new Set((data || []).map((r: any) => r.id));
}

/** Member ids among `ids` that belong to one of the given schools. */
async function membersOfSchools(supabaseClient: any, ids: string[], schoolIds: Set<string>): Promise<Set<string>> {
  const own = new Set<string>();
  for (const part of chunks([...new Set(ids)])) {
    const { data, error } = await supabaseClient.from("school_members").select("id, school_id").in("id", part);
    if (error) throw new Error(`Failed to verify school_members: ${describeError(error)}`);
    for (const row of data || []) if (schoolIds.has(row.school_id)) own.add(row.id);
  }
  return own;
}

export async function pushTrainingsChanges(
  ctx: SyncTrainingsContext,
  organizationId: string,
): Promise<void> {
  const { supabaseClient, changes } = ctx;
  let schoolIds: Set<string> | null = null;
  const orgSchools = async () => (schoolIds ??= await organizationSchoolIds(supabaseClient, organizationId));

  // Parents first so invitees can reference freshly pushed trainings.
  for (const table of ["training_series", "trainings"] as const) {
    const tableChanges = changes[table];
    if (!tableChanges) continue;
    const { created = [], updated = [], deleted = [] } = tableChanges;

    const sameOrg = [...created, ...updated].filter((r) => r.organization_id === organizationId);
    // A school audience must be one of the organization's own schools.
    const needsSchools = sameOrg.some((r) => r.school_id);
    const allowedSchools = needsSchools ? await orgSchools() : new Set<string>();
    const incoming = sameOrg.filter((r) => !r.school_id || allowedSchools.has(r.school_id));
    if (incoming.length < created.length + updated.length) {
      console.warn(`[SYNC:TRAININGS] Dropped ${table} rows outside organization ${organizationId}`);
    }
    const foreign = await foreignIds(supabaseClient, table, incoming.map((r) => r.id), organizationId);
    const rows = incoming
      .filter((r) => !foreign.has(r.id))
      .map((r) => toSupabaseTrainingRecord(r, table));
    if (table === "training_series") await scopePreviousSeries(supabaseClient, rows, organizationId);

    if (rows.length > 0) {
      const { error } = await supabaseClient.from(table).upsert(rows);
      if (error) throw new Error(`Failed to upsert ${table}: ${describeError(error)}`);
    }

    if (deleted.length > 0) {
      const { error } = await supabaseClient
        .from(table)
        .update({ deleted_at: new Date().toISOString() })
        .in("id", deleted)
        .eq("organization_id", organizationId);
      if (error) throw new Error(`Failed to delete from ${table}: ${describeError(error)}`);
    }
  }

  const invitees = changes.training_invitees;
  if (invitees) {
    const { created = [], updated = [], deleted = [] } = invitees;
    const incoming = [...created, ...updated];
    const own = await ownTrainingIds(supabaseClient, incoming.map((r) => r.training_id), organizationId);
    // Only the organization's own members can be invited.
    const members = incoming.length
      ? await membersOfSchools(supabaseClient, incoming.map((r) => r.school_member_id), await orgSchools())
      : new Set<string>();
    const rows = incoming
      .filter((r) => own.has(r.training_id) && members.has(r.school_member_id))
      .map((r) => toSupabaseTrainingRecord(r, "training_invitees"));

    if (rows.length > 0) {
      const { error } = await supabaseClient.from("training_invitees").upsert(rows);
      if (error) throw new Error(`Failed to upsert training_invitees: ${describeError(error)}`);
    }

    if (deleted.length > 0) {
      const { data, error } = await supabaseClient
        .from("training_invitees")
        .select("id, training_id")
        .in("id", deleted);
      if (error) throw new Error(`Failed to verify training_invitees: ${describeError(error)}`);
      const ownParents = await ownTrainingIds(
        supabaseClient,
        (data || []).map((r: any) => r.training_id),
        organizationId,
      );
      const ids = (data || []).filter((r: any) => ownParents.has(r.training_id)).map((r: any) => r.id);
      if (ids.length > 0) {
        const { error: deleteError } = await supabaseClient
          .from("training_invitees")
          .update({ deleted_at: new Date().toISOString() })
          .in("id", ids);
        if (deleteError) throw new Error(`Failed to delete training_invitees: ${deleteError.message}`);
      }
    }
  }
}

// =============================================================================
// PULL
// =============================================================================

/**
 * Changes for one table since lastPulledAt. A first pull — or a client that
 * just gained the table through a schema migration — gets every live row.
 */
async function fetchChanges(
  ctx: SyncTrainingsContext,
  table: TrainingTable,
  select: string,
  scope: (query: any) => any,
): Promise<TableChanges> {
  const { supabaseClient, lastPulledAt, migratedTables = [] } = ctx;
  const isFirstPull = !lastPulledAt || migratedTables.includes(table);

  let query = supabaseClient.from(table).select(select);
  query = isFirstPull
    ? query.is("deleted_at", null)
    : query.gte("updated_at", new Date(lastPulledAt).toISOString());

  const { data, error } = await scope(query);
  if (error) throw new Error(`Failed to fetch from ${table}: ${describeError(error)}`);

  const changes = empty();
  for (const row of data || []) {
    if (row.deleted_at) {
      if (!isFirstPull) changes.deleted.push(row.id);
    } else if (isFirstPull || new Date(row.created_at).getTime() > lastPulledAt) {
      changes.created.push(toWatermelonTrainingRecord(row, table));
    } else {
      changes.updated.push(toWatermelonTrainingRecord(row, table));
    }
  }
  return changes;
}

/** Everything in the owner's organization. */
export async function pullTrainingsChanges(
  ctx: SyncTrainingsContext,
  organizationId: string,
): Promise<Record<TrainingTable, TableChanges>> {
  return {
    training_series: await fetchChanges(ctx, "training_series", "*", (q) =>
      q.eq("organization_id", organizationId),
    ),
    trainings: await fetchChanges(ctx, "trainings", "*", (q) =>
      q.eq("organization_id", organizationId),
    ),
    training_invitees: await fetchChanges(
      ctx,
      "training_invitees",
      "*, trainings!inner(organization_id)",
      (q) => q.eq("trainings.organization_id", organizationId),
    ),
  };
}

// =============================================================================
// PULL (student / member, read-only)
// =============================================================================

export interface MemberScope {
  memberIds: string[];
  schoolIds: string[];
  organizationIds: string[];
  /** A membership created since the last pull: resend everything visible. */
  newMembership?: boolean;
}

/** Same audience rule as can_view_training (organization / school / invited). */
export const isTrainingVisibleToMember = (
  row: any,
  scope: MemberScope,
  invitedTrainingIds: Set<string>,
): boolean => {
  if (row.deleted_at) return false;
  switch (row.visibility) {
    case "organization":
      return scope.organizationIds.includes(row.organization_id);
    case "school":
      return !!row.school_id && scope.schoolIds.includes(row.school_id);
    case "whitelist":
      return invitedTrainingIds.has(row.id);
    default:
      return false;
  }
};

/**
 * Trainings a member may see. A first pull sends every visible live row; an
 * incremental pull re-evaluates trainings changed in the member's
 * organizations and trainings whose invitation for the member changed, and
 * sends the ones no longer visible as deleted (audience edits, removed
 * invitations, cancellations stay as updates).
 */
export async function pullTrainingsForMember(
  ctx: SyncTrainingsContext,
  scope: MemberScope,
): Promise<{ trainings: TableChanges; training_invitees: TableChanges }> {
  const { supabaseClient, lastPulledAt, migratedTables = [] } = ctx;
  const changes = empty();
  const ownInvitations = empty();
  if (scope.organizationIds.length === 0 || scope.memberIds.length === 0) {
    return { trainings: changes, training_invitees: ownInvitations };
  }

  const isFirstPull = !lastPulledAt || migratedTables.includes("trainings") || !!scope.newMembership;

  const { data: invitations, error: invitationsError } = await supabaseClient
    .from("training_invitees")
    .select("*")
    .in("school_member_id", scope.memberIds);
  if (invitationsError) throw new Error(`Failed to fetch training_invitees: ${invitationsError.message}`);
  const invited = new Set<string>(
    (invitations || []).filter((i: any) => !i.deleted_at).map((i: any) => i.training_id),
  );

  // The member's own invitation rows (lets the app filter by school locally).
  for (const row of invitations || []) {
    if (isFirstPull) {
      if (!row.deleted_at) ownInvitations.created.push(toWatermelonTrainingRecord(row, "training_invitees"));
    } else if (new Date(row.updated_at).getTime() >= lastPulledAt) {
      if (row.deleted_at) ownInvitations.deleted.push(row.id);
      else if (new Date(row.created_at).getTime() > lastPulledAt) {
        ownInvitations.created.push(toWatermelonTrainingRecord(row, "training_invitees"));
      } else ownInvitations.updated.push(toWatermelonTrainingRecord(row, "training_invitees"));
    }
  }

  if (isFirstPull) {
    const { data, error } = await supabaseClient
      .from("trainings")
      .select("*")
      .in("organization_id", scope.organizationIds)
      .is("deleted_at", null);
    if (error) throw new Error(`Failed to fetch trainings: ${describeError(error)}`);
    for (const row of data || []) {
      if (isTrainingVisibleToMember(row, scope, invited)) {
        changes.created.push(toWatermelonTrainingRecord(row, "trainings"));
      }
    }
    return { trainings: changes, training_invitees: ownInvitations };
  }

  const since = new Date(lastPulledAt).toISOString();
  const { data: changed, error } = await supabaseClient
    .from("trainings")
    .select("*")
    .in("organization_id", scope.organizationIds)
    .gte("updated_at", since);
  if (error) throw new Error(`Failed to fetch trainings: ${describeError(error)}`);

  const rows: any[] = [...(changed || [])];
  const seen = new Set(rows.map((r) => r.id));
  const invitationChanged = new Set<string>(
    (invitations || [])
      .filter((i: any) => new Date(i.updated_at).getTime() >= lastPulledAt)
      .map((i: any) => i.training_id),
  );
  const missing = [...invitationChanged].filter((id) => !seen.has(id));
  for (const part of chunks(missing)) {
    const { data, error: extraError } = await supabaseClient.from("trainings").select("*").in("id", part);
    if (extraError) throw new Error(`Failed to fetch trainings: ${extraError.message}`);
    rows.push(...(data || []));
  }

  for (const row of rows) {
    if (!isTrainingVisibleToMember(row, scope, invited)) {
      changes.deleted.push(row.id);
    } else if (
      new Date(row.created_at).getTime() > lastPulledAt ||
      (invitationChanged.has(row.id) && row.visibility === "whitelist")
    ) {
      changes.created.push(toWatermelonTrainingRecord(row, "trainings"));
    } else {
      changes.updated.push(toWatermelonTrainingRecord(row, "trainings"));
    }
  }
  return { trainings: changes, training_invitees: ownInvitations };
}
