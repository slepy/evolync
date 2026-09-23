/**
 * Sync logic for Tags tables (user-private data)
 *
 * Handles push and pull for:
 * - tags (user-owned labels)
 * - taggables (polymorphic join between tag and any entity)
 *
 * All data is filtered by user_id (via tags.user_id) for security.
 * Shared between sync-organization and sync-user.
 */

import { convertToSupabaseRecord } from "./utils.ts";

interface SyncTagsContext {
  supabaseClient: any;
  userId: string;
  changes: Record<string, { created: any[]; updated: any[]; deleted: string[] }>;
  lastPulledAt: number;
}

type FetchTableChangesFn = (
  tableName: string,
  filterFn?: (query: any) => any,
) => Promise<{ created: any[]; updated: any[]; deleted: string[] }>;

/**
 * Push tags changes from client to Supabase
 */
export async function pushTagsChanges(ctx: SyncTagsContext): Promise<void> {
  const { supabaseClient, userId, changes } = ctx;

  // Push tags (user-owned — filter by user_id)
  const tagChanges = changes["tags"];
  if (tagChanges) {
    const created = tagChanges.created.filter((r) => r.user_id === userId);
    const updated = tagChanges.updated.filter((r) => r.user_id === userId);

    if (created.length > 0) {
      console.log(`[SYNC:TAGS] Processing ${created.length} created tags`);
      const { error } = await supabaseClient
        .from("tags")
        .upsert(created.map((r) => convertToSupabaseRecord(r, "tags")));
      if (error) console.error("[SYNC:TAGS] Failed to insert tags:", error);
    }

    if (updated.length > 0) {
      console.log(`[SYNC:TAGS] Processing ${updated.length} updated tags`);
      for (const record of updated) {
        const { error } = await supabaseClient
          .from("tags")
          .update(convertToSupabaseRecord(record, "tags"))
          .eq("id", record.id);
        if (error) console.error("[SYNC:TAGS] Failed to update tag:", error);
      }
    }

    if (tagChanges.deleted.length > 0) {
      console.log(`[SYNC:TAGS] Processing ${tagChanges.deleted.length} deleted tags`);
      const { error } = await supabaseClient
        .from("tags")
        .update({ deleted_at: new Date().toISOString() })
        .in("id", tagChanges.deleted);
      if (error) console.error("[SYNC:TAGS] Failed to soft-delete tags:", error);
    }
  }

  // Push taggables — validated by RLS (join to parent tag owned by user)
  // taggables use hard-delete: no deleted_at column, WatermelonDB prepareMarkAsDeleted()
  const taggableChanges = changes["taggables"];
  console.log("[SYNC:TAGS] taggableChanges raw:", JSON.stringify(taggableChanges));
  if (taggableChanges) {
    if (taggableChanges.created.length > 0) {
      console.log(`[SYNC:TAGS] Processing ${taggableChanges.created.length} created taggables`);
      const { error } = await supabaseClient
        .from("taggables")
        .upsert(taggableChanges.created.map((r) => convertToSupabaseRecord(r, "taggables")));
      if (error) console.error("[SYNC:TAGS] Failed to insert taggables:", error);
    }

    if (taggableChanges.deleted.length > 0) {
      console.log(`[SYNC:TAGS] Processing ${taggableChanges.deleted.length} deleted taggables`);
      const { error } = await supabaseClient
        .from("taggables")
        .delete()
        .in("id", taggableChanges.deleted);
      if (error) console.error("[SYNC:TAGS] Failed to delete taggables:", error);
    }
  }
}

/**
 * Pull tags changes from Supabase to client
 */
export async function pullTagsChanges(
  ctx: SyncTagsContext,
  fetchTableChanges: FetchTableChangesFn,
): Promise<Record<string, { created: any[]; updated: any[]; deleted: string[] }>> {
  const { supabaseClient, userId } = ctx;
  const pullChanges: Record<string, { created: any[]; updated: any[]; deleted: string[] }> = {};

  // Pull user's tags
  pullChanges.tags = await fetchTableChanges("tags", (q) => q.eq("user_id", userId));

  // Pull taggables for user's tags
  // taggables use hard-delete: no updated_at/deleted_at — fetch all rows for user's tags
  // and let WatermelonDB reconcile (missing rows = deleted)
  const { data: userTags } = await supabaseClient
    .from("tags")
    .select("id")
    .eq("user_id", userId)
    .is("deleted_at", null);

  const tagIds = (userTags || []).map((t: any) => t.id);

  if (tagIds.length > 0) {
    const { data: taggableRows, error: taggableError } = await supabaseClient
      .from("taggables")
      .select("*")
      .in("tag_id", tagIds)
      .gte("created_at", new Date(ctx.lastPulledAt).toISOString());

    if (taggableError) {
      console.error("[SYNC:TAGS] Error fetching taggables:", taggableError);
      pullChanges.taggables = { created: [], updated: [], deleted: [] };
    } else {
      pullChanges.taggables = {
        created: (taggableRows || []).map((r: any) => ({
          id: r.id,
          tag_id: r.tag_id,
          taggable_id: r.taggable_id,
          taggable_type: r.taggable_type,
          created_at: new Date(r.created_at).getTime(),
        })),
        updated: [],
        deleted: [],
      };
    }
  } else {
    pullChanges.taggables = { created: [], updated: [], deleted: [] };
  }

  return pullChanges;
}
