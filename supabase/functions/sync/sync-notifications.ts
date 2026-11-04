/**
 * Sync logic for the notifications table (recipient-private data)
 *
 * Notifications are created server-side by Postgres triggers, so the client
 * never creates them. The accepted client changes, on the caller's own rows,
 * are `read_at` and a soft delete (`deleted_at`, set only — never cleared).
 *
 * Shared between sync-organization and sync-user: notifications are pulled
 * by recipient in both sync modes (an owner can also be a student elsewhere).
 */

export const NOTIFICATIONS_TABLE = "notifications";

/** First pull (or first pull after the client gained the table) is bounded. */
export const FIRST_PULL_WINDOW_DAYS = 90;

type TableChanges = { created: any[]; updated: any[]; deleted: string[] };

interface SyncNotificationsContext {
  supabaseClient: any;
  userId: string;
  changes: Record<string, TableChanges>;
  lastPulledAt: number;
  /** Tables the client just gained through a schema migration (WatermelonDB migration sync). */
  migratedTables?: string[];
}

const toIso = (value: unknown): string | null => {
  if (typeof value === "number" && value > 0) return new Date(value).toISOString();
  return null;
};

const toMs = (value: unknown): number | null =>
  typeof value === "string" ? new Date(value).getTime() : null;

/**
 * Convert a Supabase notifications row to the WatermelonDB raw shape:
 * timestamps → ms, payload jsonb → JSON string, server-only columns dropped.
 */
export function toWatermelonNotification(row: any): any {
  return {
    id: row.id,
    recipient_id: row.recipient_id,
    school_id: row.school_id ?? null,
    type: row.type,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    payload: JSON.stringify(row.payload ?? {}),
    read_at: toMs(row.read_at),
    created_at: toMs(row.created_at),
    updated_at: toMs(row.updated_at),
    deleted_at: toMs(row.deleted_at),
  };
}

/**
 * Push: apply `read_at` from updated records owned by the caller, and a soft
 * delete when the record carries `deleted_at`. A deletion only lands on a
 * live row, so a server-side deletion time is kept and nothing is undeleted.
 * Every other column, and all created/deleted records, are ignored.
 */
export async function pushNotificationsChanges(ctx: SyncNotificationsContext): Promise<void> {
  const { supabaseClient, userId, changes } = ctx;
  const tableChanges = changes[NOTIFICATIONS_TABLE];
  if (!tableChanges) return;

  const { created = [], updated = [], deleted = [] } = tableChanges;
  if (created.length > 0 || deleted.length > 0) {
    console.log(
      `[SYNC:NOTIFICATIONS] Ignoring ${created.length} created / ${deleted.length} deleted (server-generated table)`,
    );
  }

  for (const record of updated) {
    if (!record?.id) continue;

    // The server clock stamps the deletion; the client value only signals it.
    const deleting = toIso(record.deleted_at) !== null;
    const query = supabaseClient
      .from(NOTIFICATIONS_TABLE)
      .update(
        deleting
          ? { read_at: toIso(record.read_at), deleted_at: new Date().toISOString() }
          : { read_at: toIso(record.read_at) },
      )
      .eq("id", record.id)
      .eq("recipient_id", userId);
    const { error } = deleting ? await query.is("deleted_at", null) : await query;

    if (error) {
      console.error(`[SYNC:NOTIFICATIONS] Failed to update ${record.id}:`, error);
    }
  }
}

/**
 * Pull: the caller's notifications changed since lastPulledAt. On a first
 * pull (or when the client just gained the table through a migration) only
 * live rows from the last FIRST_PULL_WINDOW_DAYS days are sent.
 */
export async function pullNotificationsChanges(
  ctx: SyncNotificationsContext,
): Promise<Record<string, TableChanges>> {
  const { supabaseClient, userId, lastPulledAt, migratedTables = [] } = ctx;
  const isFirstPull = !lastPulledAt || migratedTables.includes(NOTIFICATIONS_TABLE);

  if (isFirstPull) {
    const since = new Date(Date.now() - FIRST_PULL_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabaseClient
      .from(NOTIFICATIONS_TABLE)
      .select("*")
      .eq("recipient_id", userId)
      .is("deleted_at", null)
      .gte("created_at", since);

    if (error) {
      console.error("[SYNC:NOTIFICATIONS] Error fetching notifications:", error);
      return { [NOTIFICATIONS_TABLE]: { created: [], updated: [], deleted: [] } };
    }

    return {
      [NOTIFICATIONS_TABLE]: {
        created: (data || []).map(toWatermelonNotification),
        updated: [],
        deleted: [],
      },
    };
  }

  const lastPulledDate = new Date(lastPulledAt).toISOString();
  const { data, error } = await supabaseClient
    .from(NOTIFICATIONS_TABLE)
    .select("*")
    .eq("recipient_id", userId)
    .gte("updated_at", lastPulledDate);

  if (error) {
    console.error("[SYNC:NOTIFICATIONS] Error fetching notifications:", error);
    return { [NOTIFICATIONS_TABLE]: { created: [], updated: [], deleted: [] } };
  }

  const created: any[] = [];
  const updated: any[] = [];
  const deleted: string[] = [];

  for (const row of data || []) {
    if (row.deleted_at) {
      deleted.push(row.id);
    } else if (new Date(row.created_at).getTime() > lastPulledAt) {
      created.push(toWatermelonNotification(row));
    } else {
      updated.push(toWatermelonNotification(row));
    }
  }

  return { [NOTIFICATIONS_TABLE]: { created, updated, deleted } };
}
