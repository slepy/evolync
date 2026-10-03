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

import { convertToSupabaseRecord, convertToWatermelonRecord } from "./utils.ts";

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
    if (error) throw new Error(`Failed to verify ${table}: ${error.message}`);
    for (const row of data || []) {
      if (row.organization_id !== organizationId) foreign.add(row.id);
    }
  }
  return foreign;
}

/** Training ids among `ids` that belong to the organization. */
async function ownTrainingIds(
  supabaseClient: any,
  ids: string[],
  organizationId: string,
): Promise<Set<string>> {
  const own = new Set<string>();
  for (const part of chunks([...new Set(ids)])) {
    const { data, error } = await supabaseClient
      .from("trainings")
      .select("id")
      .in("id", part)
      .eq("organization_id", organizationId);
    if (error) throw new Error(`Failed to verify trainings: ${error.message}`);
    for (const row of data || []) own.add(row.id);
  }
  return own;
}

export async function pushTrainingsChanges(
  ctx: SyncTrainingsContext,
  organizationId: string,
): Promise<void> {
  const { supabaseClient, changes } = ctx;

  // Parents first so invitees can reference freshly pushed trainings.
  for (const table of ["training_series", "trainings"] as const) {
    const tableChanges = changes[table];
    if (!tableChanges) continue;
    const { created = [], updated = [], deleted = [] } = tableChanges;

    const incoming = [...created, ...updated].filter((r) => r.organization_id === organizationId);
    if (incoming.length < created.length + updated.length) {
      console.warn(`[SYNC:TRAININGS] Dropped ${table} rows outside organization ${organizationId}`);
    }
    const foreign = await foreignIds(supabaseClient, table, incoming.map((r) => r.id), organizationId);
    const rows = incoming
      .filter((r) => !foreign.has(r.id))
      .map((r) => toSupabaseTrainingRecord(r, table));

    if (rows.length > 0) {
      const { error } = await supabaseClient.from(table).upsert(rows);
      if (error) throw new Error(`Failed to upsert ${table}: ${error.message}`);
    }

    if (deleted.length > 0) {
      const { error } = await supabaseClient
        .from(table)
        .update({ deleted_at: new Date().toISOString() })
        .in("id", deleted)
        .eq("organization_id", organizationId);
      if (error) throw new Error(`Failed to delete from ${table}: ${error.message}`);
    }
  }

  const invitees = changes.training_invitees;
  if (invitees) {
    const { created = [], updated = [], deleted = [] } = invitees;
    const incoming = [...created, ...updated];
    const own = await ownTrainingIds(supabaseClient, incoming.map((r) => r.training_id), organizationId);
    const rows = incoming
      .filter((r) => own.has(r.training_id))
      .map((r) => toSupabaseTrainingRecord(r, "training_invitees"));

    if (rows.length > 0) {
      const { error } = await supabaseClient.from("training_invitees").upsert(rows);
      if (error) throw new Error(`Failed to upsert training_invitees: ${error.message}`);
    }

    if (deleted.length > 0) {
      const { data, error } = await supabaseClient
        .from("training_invitees")
        .select("id, training_id")
        .in("id", deleted);
      if (error) throw new Error(`Failed to verify training_invitees: ${error.message}`);
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
  if (error) throw new Error(`Failed to fetch from ${table}: ${error.message}`);

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
