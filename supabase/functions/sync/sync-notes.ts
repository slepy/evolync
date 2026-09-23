/**
 * Sync logic for Technique Notes tables (user-private data)
 *
 * Handles push and pull for:
 * - technique_note_documents (user-owned documents)
 * - technique_note_rows (child of documents)
 *
 * All data is filtered by user_id for security.
 * Shared between sync-organization and sync-user because notes are always
 * user-private, regardless of role.
 */

import { convertToSupabaseRecord } from "./utils.ts";

interface SyncNotesContext {
  supabaseClient: any;
  userId: string;
  changes: Record<string, { created: any[]; updated: any[]; deleted: string[] }>;
  lastPulledAt: number;
}

type FetchTableChangesFn = (
  tableName: string,
  filterFn?: (query: any) => any,
) => Promise<{ created: any[]; updated: any[]; deleted: string[] }>;

const NOTES_TABLES = [
  "technique_note_documents",
  "technique_note_rows",
];

/**
 * Push notes changes from client to Supabase
 */
export async function pushNotesChanges(ctx: SyncNotesContext): Promise<void> {
  const { supabaseClient, userId, changes } = ctx;

  for (const tableName of NOTES_TABLES) {
    const tableChanges = changes[tableName];
    if (!tableChanges) continue;

    let { created, updated, deleted } = tableChanges;

    // Security: filter root documents to only user's own records
    if (tableName === "technique_note_documents") {
      created = created.filter((r) => r.user_id === userId);
      updated = updated.filter((r) => r.user_id === userId);
    }
    // technique_note_rows: validated by RLS (join to parent document)

    if (created.length > 0) {
      console.log(`[SYNC:NOTES] Processing ${created.length} created records for ${tableName}`);

      const records = created.map((record) =>
        convertToSupabaseRecord(record, tableName),
      );

      const { error } = await supabaseClient
        .from(tableName)
        .upsert(records);

      if (error) {
        console.error(`[SYNC:NOTES] Failed to insert to ${tableName}:`, error);
      }
    }

    if (updated.length > 0) {
      console.log(`[SYNC:NOTES] Processing ${updated.length} updated records for ${tableName}`);

      for (const record of updated) {
        const supabaseRecord = convertToSupabaseRecord(record, tableName);
        const { error } = await supabaseClient
          .from(tableName)
          .update(supabaseRecord)
          .eq("id", record.id);

        if (error) {
          console.error(`[SYNC:NOTES] Failed to update ${tableName}:`, error);
        }
      }
    }

    if (deleted.length > 0) {
      console.log(`[SYNC:NOTES] Processing ${deleted.length} deletes for ${tableName}`);

      const { error } = await supabaseClient
        .from(tableName)
        .update({ deleted_at: new Date().toISOString() })
        .in("id", deleted);

      if (error) {
        console.error(`[SYNC:NOTES] Failed to delete from ${tableName}:`, error);
      }
    }
  }
}

/**
 * Pull notes changes from Supabase to client
 */
export async function pullNotesChanges(
  ctx: SyncNotesContext,
  fetchTableChanges: FetchTableChangesFn,
): Promise<Record<string, { created: any[]; updated: any[]; deleted: string[] }>> {
  const { supabaseClient, userId } = ctx;
  const pullChanges: Record<
    string,
    { created: any[]; updated: any[]; deleted: string[] }
  > = {};

  // Documents (user-owned)
  pullChanges.technique_note_documents = await fetchTableChanges(
    "technique_note_documents",
    (q) => q.eq("user_id", userId),
  );

  // Get document IDs for child rows
  const { data: userDocuments } = await supabaseClient
    .from("technique_note_documents")
    .select("id")
    .eq("user_id", userId)
    .is("deleted_at", null);
  const documentIds = (userDocuments || []).map((d: any) => d.id);

  if (documentIds.length > 0) {
    pullChanges.technique_note_rows = await fetchTableChanges(
      "technique_note_rows",
      (q) => q.in("document_id", documentIds),
    );
  } else {
    pullChanges.technique_note_rows = { created: [], updated: [], deleted: [] };
  }

  return pullChanges;
}
