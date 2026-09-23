/**
 * Sync logic for 3D tables (user-private data)
 *
 * Handles push and pull for:
 * - body_pose_presets (user-owned presets)
 * - techniques (user-private)
 * - sequences (user-private)
 * - sequence_steps (child of sequences)
 * - step_techniques (child of sequence_steps)
 *
 * All data is filtered by user_id for security.
 * This is shared between sync-organization and sync-user
 * because 3D data is always user-private, regardless of role.
 */

import { convertToSupabaseRecord } from "./utils.ts";

interface SyncThreeDContext {
  supabaseClient: any;
  userId: string;
  changes: Record<string, { created: any[]; updated: any[]; deleted: string[] }>;
  lastPulledAt: number;
}

type FetchTableChangesFn = (
  tableName: string,
  filterFn?: (query: any) => any,
) => Promise<{ created: any[]; updated: any[]; deleted: string[] }>;

// 3D tables in dependency order
const THREED_TABLES = [
  "body_pose_presets",
  "techniques",
  "sequences",
  "sequence_steps",
  "step_techniques",
];

/**
 * Push 3D changes from client to Supabase
 */
export async function pushThreeDChanges(ctx: SyncThreeDContext): Promise<void> {
  const { supabaseClient, userId, changes } = ctx;

  for (const tableName of THREED_TABLES) {
    const tableChanges = changes[tableName];
    if (!tableChanges) continue;

    let { created, updated, deleted } = tableChanges;

    // Security: filter user-owned records
    if (tableName === "techniques" || tableName === "sequences" || tableName === "body_pose_presets") {
      created = created.filter((r) => r.user_id === userId);
      updated = updated.filter((r) => r.user_id === userId);
      deleted = deleted; // deleted are already user-filtered by client
    }

    // Insert created records
    if (created.length > 0) {
      console.log(
        `[SYNC:3D] Processing ${created.length} created records for ${tableName}`,
      );

      const records = created.map((record) =>
        convertToSupabaseRecord(record, tableName),
      );

      const { error } = await supabaseClient
        .from(tableName)
        .upsert(records);

      if (error) {
        console.error(`[SYNC:3D] Failed to insert to ${tableName}:`, error);
      }
    }

    // Update existing records
    if (updated.length > 0) {
      console.log(
        `[SYNC:3D] Processing ${updated.length} updated records for ${tableName}`,
      );

      for (const record of updated) {
        const supabaseRecord = convertToSupabaseRecord(record, tableName);
        const { error } = await supabaseClient
          .from(tableName)
          .update(supabaseRecord)
          .eq("id", record.id);

        if (error) {
          console.error(`[SYNC:3D] Failed to update ${tableName}:`, error);
        }
      }
    }

    // Soft delete records
    if (deleted.length > 0) {
      console.log(
        `[SYNC:3D] Processing ${deleted.length} deletes for ${tableName}`,
      );

      const { error } = await supabaseClient
        .from(tableName)
        .update({ deleted_at: new Date().toISOString() })
        .in("id", deleted);

      if (error) {
        console.error(`[SYNC:3D] Failed to delete from ${tableName}:`, error);
      }
    }
  }
}

/**
 * Pull 3D changes from Supabase to client
 */
export async function pullThreeDChanges(
  ctx: SyncThreeDContext,
  fetchTableChanges: FetchTableChangesFn,
): Promise<Record<string, { created: any[]; updated: any[]; deleted: string[] }>> {
  const { supabaseClient, userId } = ctx;
  const pullChanges: Record<
    string,
    { created: any[]; updated: any[]; deleted: string[] }
  > = {};

  // Body pose presets (user-owned)
  pullChanges.body_pose_presets = await fetchTableChanges("body_pose_presets", (q) =>
    q.eq("user_id", userId),
  );

  // Techniques (private to user)
  pullChanges.techniques = await fetchTableChanges("techniques", (q) =>
    q.eq("user_id", userId),
  );

  // Sequences (private to user)
  pullChanges.sequences = await fetchTableChanges("sequences", (q) =>
    q.eq("user_id", userId),
  );

  // Get sequence IDs for child tables
  const { data: userSequences } = await supabaseClient
    .from("sequences")
    .select("id")
    .eq("user_id", userId)
    .is("deleted_at", null);
  const sequenceIds = (userSequences || []).map((s: any) => s.id);

  // Sequence steps + step techniques
  if (sequenceIds.length > 0) {
    pullChanges.sequence_steps = await fetchTableChanges("sequence_steps", (q) =>
      q.in("sequence_id", sequenceIds),
    );

    // Get step IDs for step_techniques
    const { data: userSteps } = await supabaseClient
      .from("sequence_steps")
      .select("id")
      .in("sequence_id", sequenceIds)
      .is("deleted_at", null);
    const stepIds = (userSteps || []).map((s: any) => s.id);

    if (stepIds.length > 0) {
      pullChanges.step_techniques = await fetchTableChanges("step_techniques", (q) =>
        q.in("step_id", stepIds),
      );
    } else {
      pullChanges.step_techniques = { created: [], updated: [], deleted: [] };
    }
  } else {
    pullChanges.sequence_steps = { created: [], updated: [], deleted: [] };
    pullChanges.step_techniques = { created: [], updated: [], deleted: [] };
  }

  return pullChanges;
}
