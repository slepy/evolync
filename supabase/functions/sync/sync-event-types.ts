/**
 * Sync of EVENT TYPES (organization-scoped vocabulary: Seminar, Camp…).
 *
 * - The organization owner pushes them with the organization tables
 *   (sync-organization.ts) and pulls every type of the organization.
 * - A member pulls only the types their pulled events point at (read-only).
 *
 * A deleted type is sent as an update carrying `deleted_at`, never as a
 * delete: an event may still point at it and keeps showing its name.
 */

import { convertToWatermelonRecord } from "./utils.ts";

export const EVENT_TYPES_TABLE = "event_types";

type TableChanges = { created: any[]; updated: any[]; deleted: string[] };

export interface SyncEventTypesContext {
  supabaseClient: any;
  lastPulledAt: number;
  migratedTables?: string[];
}

const IN_CHUNK = 200;

const chunks = <T>(items: T[]): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += IN_CHUNK) out.push(items.slice(i, i + IN_CHUNK));
  return out;
};

const isFirstPullOf = ({ lastPulledAt, migratedTables = [] }: SyncEventTypesContext) =>
  !lastPulledAt || migratedTables.includes(EVENT_TYPES_TABLE);

/**
 * Splits fetched rows into created / updated. A first pull gets every live
 * row (plus the deleted ones listed in `keepDeleted`, still referenced by an
 * event); later pulls send rows changed since `lastPulledAt` and every row in
 * `force` (types of events the client receives in this pull).
 */
export function eventTypeChanges(
  rows: any[],
  lastPulledAt: number,
  isFirstPull: boolean,
  options: { force?: Set<string>; keepDeleted?: Set<string> } = {},
): TableChanges {
  const changes: TableChanges = { created: [], updated: [], deleted: [] };
  for (const row of rows) {
    const createdAt = new Date(row.created_at).getTime();
    const updatedAt = new Date(row.updated_at).getTime();
    if (isFirstPull) {
      if (!row.deleted_at || options.keepDeleted?.has(row.id)) {
        changes.created.push(convertToWatermelonRecord(row, EVENT_TYPES_TABLE));
      }
      continue;
    }
    const changed = updatedAt >= lastPulledAt || createdAt > lastPulledAt;
    if (!changed && !options.force?.has(row.id)) continue;
    // A type created and deleted between two pulls never reached the device.
    if (row.deleted_at && createdAt > lastPulledAt && !options.force?.has(row.id)) continue;
    if (createdAt > lastPulledAt && !row.deleted_at) {
      changes.created.push(convertToWatermelonRecord(row, EVENT_TYPES_TABLE));
    } else {
      changes.updated.push(convertToWatermelonRecord(row, EVENT_TYPES_TABLE));
    }
  }
  return changes;
}

/**
 * An owner's pushed event_types rows: only their own organization's (the sync
 * runs with the service role, so RLS does not stop a foreign organization id).
 */
export const ownEventTypesPush = (records: any[], organizationId: string): any[] => {
  const own = records.filter((r: any) => r.organization_id === organizationId);
  if (own.length < records.length) {
    console.log(`[SYNC:EVENT_TYPES] Dropped ${records.length - own.length} rows outside organization ${organizationId}`);
  }
  return own;
};

/** Distinct, non-empty `type_id`s of event rows. */
export const referencedTypeIds = (events: any[]): string[] => [
  ...new Set(events.map((e) => e?.type_id).filter((id): id is string => typeof id === "string" && id.length > 0)),
];

/** Every type of the owner's organization. */
export async function pullEventTypesForOrganization(
  ctx: SyncEventTypesContext,
  organizationId: string,
): Promise<TableChanges> {
  const { supabaseClient, lastPulledAt } = ctx;
  const isFirstPull = isFirstPullOf(ctx);

  let query = supabaseClient.from(EVENT_TYPES_TABLE).select("*").eq("organization_id", organizationId);
  if (!isFirstPull) query = query.gte("updated_at", new Date(lastPulledAt).toISOString());
  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch from ${EVENT_TYPES_TABLE}: ${error.message}`);

  // Deleted types still used by an event stay readable on a fresh device.
  let keepDeleted = new Set<string>();
  const deletedIds = (data || []).filter((r: any) => r.deleted_at).map((r: any) => r.id);
  if (isFirstPull && deletedIds.length > 0) {
    for (const part of chunks(deletedIds)) {
      const { data: used, error: usedError } = await supabaseClient
        .from("events")
        .select("type_id")
        .in("type_id", part)
        .is("deleted_at", null);
      if (usedError) throw new Error(`Failed to fetch events: ${usedError.message}`);
      keepDeleted = new Set([...keepDeleted, ...referencedTypeIds(used || [])]);
    }
  }

  return eventTypeChanges(data || [], lastPulledAt, isFirstPull, { keepDeleted });
}

/**
 * Types of a member's events (read-only). `eventIds` are every event the
 * member takes part in; `pulledEvents` the event rows sent in this pull,
 * whose types are always sent so a newly visible event resolves its type.
 */
export async function pullEventTypesForMember(
  ctx: SyncEventTypesContext,
  eventIds: string[],
  pulledEvents: any[],
): Promise<TableChanges> {
  const { supabaseClient, lastPulledAt } = ctx;
  const isFirstPull = isFirstPullOf(ctx);
  if (eventIds.length === 0) return { created: [], updated: [], deleted: [] };

  const typeIds = new Set<string>();
  for (const part of chunks(eventIds)) {
    const { data, error } = await supabaseClient
      .from("events")
      .select("type_id")
      .in("id", part)
      .is("deleted_at", null);
    if (error) throw new Error(`Failed to fetch events: ${error.message}`);
    for (const id of referencedTypeIds(data || [])) typeIds.add(id);
  }
  if (typeIds.size === 0) return { created: [], updated: [], deleted: [] };

  const rows: any[] = [];
  for (const part of chunks([...typeIds])) {
    const { data, error } = await supabaseClient.from(EVENT_TYPES_TABLE).select("*").in("id", part);
    if (error) throw new Error(`Failed to fetch from ${EVENT_TYPES_TABLE}: ${error.message}`);
    rows.push(...(data || []));
  }

  return eventTypeChanges(rows, lastPulledAt, isFirstPull, {
    force: new Set(referencedTypeIds(pulledEvents)),
    keepDeleted: typeIds,
  });
}
