/**
 * Sync logic for USERS (users who don't own an organization but are members of schools)
 *
 * Syncs only user's school memberships and related data:
 * - Schools they belong to
 * - Their own school_member records
 * - Their attendance, payments, orders
 * - Events they're invited to
 *
 * Does NOT sync:
 * - Organization data (they're not owners)
 * - Other students' private data
 * - School management features (invites, grading config)
 */

import { SyncContext, SyncPullChanges } from "./types.ts";
import { PULL_TIMESTAMP_MARGIN_MS } from "./utils.ts";
import { pushThreeDChanges, pullThreeDChanges } from "./sync-threed.ts";
import { pushNotesChanges, pullNotesChanges } from "./sync-notes.ts";
import { pushTagsChanges, pullTagsChanges } from "./sync-tags.ts";
import { pushNotificationsChanges, pullNotificationsChanges } from "./sync-notifications.ts";
import {
  createFetchTableChanges,
  fetchMemberships,
  pullMemberChanges,
  pushMemberChanges,
} from "./sync-member.ts";

export async function syncUser(ctx: SyncContext): Promise<SyncPullChanges> {
  const { supabaseClient, userId, changes, lastPulledAt } = ctx;

  console.log(`[SYNC:USER] Starting sync for user: ${userId}`);
  console.log(`[SYNC:USER] Received changes from client:`, {
    school_members: {
      created: changes.school_members?.created?.length || 0,
      updated: changes.school_members?.updated?.length || 0,
    },
    orders: {
      created: changes.orders?.created?.length || 0,
      updated: changes.orders?.updated?.length || 0,
    },
  });

  // ===========================================================================
  // PUSH: The user's own student rows
  // ===========================================================================
  await pushMemberChanges(ctx, changes, "[SYNC:USER]");

  // ===========================================================================
  // PUSH: 3D Tables (user-private)
  // ===========================================================================
  await pushThreeDChanges({ supabaseClient, userId, changes, lastPulledAt });

  // ===========================================================================
  // PUSH: Notes Tables (user-private)
  // ===========================================================================
  await pushNotesChanges({ supabaseClient, userId, changes, lastPulledAt });

  // ===========================================================================
  // PUSH: Tags Tables (user-private)
  // ===========================================================================
  await pushTagsChanges({ supabaseClient, userId, changes, lastPulledAt });

  // ===========================================================================
  // PUSH: Notifications (recipient-private, read_at only)
  // ===========================================================================
  await pushNotificationsChanges(ctx);

  // Taken before the pull reads anything: a row written while it runs is
  // pulled next time instead of falling behind the returned timestamp.
  const pullTimestamp = Date.now() - PULL_TIMESTAMP_MARGIN_MS;

  // ===========================================================================
  // REFRESH MEMBERSHIP: After PUSH, re-fetch user's schools to include newly joined schools
  // ===========================================================================

  const memberships = await fetchMemberships(ctx);
  console.log(
    `[SYNC:USER] User ${userId} memberships after PUSH: ${JSON.stringify(memberships)}`,
  );

  // If user has no schools, return empty changes
  if (memberships.length === 0) {
    console.log(`[SYNC:USER] User ${userId} has no schools, returning notifications only`);
    return {
      changes: await pullNotificationsChanges(ctx),
      timestamp: pullTimestamp,
    };
  }

  // ===========================================================================
  // PULL: Member schools and the user's own rows there
  // ===========================================================================
  const pullChanges: Record<
    string,
    { created: any[]; updated: any[]; deleted: string[] }
  > = await pullMemberChanges(ctx, memberships, "[SYNC:USER]");

  // 3D / notes / tags are user-private: incremental unless migrated
  const fetchTableChanges = createFetchTableChanges(
    ctx,
    (tableName) => (ctx.columnMigratedTables ?? []).includes(tableName),
    "[SYNC:USER]",
  );

  // Users don't sync these tables (organization-owner only)
  pullChanges.organizations = { created: [], updated: [], deleted: [] };
  pullChanges.organization_gradings = { created: [], updated: [], deleted: [] };
  pullChanges.school_invites = { created: [], updated: [], deleted: [] };

  // ===========================================================================
  // PULL: 3D Tables (user-private, shared logic)
  // ===========================================================================
  const threeDChanges = await pullThreeDChanges(
    { supabaseClient, userId, changes, lastPulledAt },
    fetchTableChanges,
  );
  Object.assign(pullChanges, threeDChanges);

  // ===========================================================================
  // PULL: Notes Tables (user-private)
  // ===========================================================================
  const notesChanges = await pullNotesChanges(
    { supabaseClient, userId, changes, lastPulledAt },
    fetchTableChanges,
  );
  Object.assign(pullChanges, notesChanges);

  // ===========================================================================
  // PULL: Tags Tables (user-private)
  // ===========================================================================
  const tagsChanges = await pullTagsChanges(
    { supabaseClient, userId, changes, lastPulledAt },
    fetchTableChanges,
  );
  Object.assign(pullChanges, tagsChanges);

  // ===========================================================================
  // PULL: Notifications (recipient-private)
  // ===========================================================================
  Object.assign(pullChanges, await pullNotificationsChanges(ctx));

  // Log summary of pulled data
  console.log(`[SYNC:USER] ========================================`);
  console.log(`[SYNC:USER] PULL Summary for user ${userId}:`);
  for (const [table, changes] of Object.entries(pullChanges)) {
    const { created, updated, deleted } = changes;
    if (created.length > 0 || updated.length > 0 || deleted.length > 0) {
      console.log(`[SYNC:USER] - ${table}: c=${created.length}, u=${updated.length}, d=${deleted.length}`);

      // Log school_members in detail
      if (table === 'school_members' && created.length > 0) {
        console.log(`[SYNC:USER]   school_members created:`, JSON.stringify(created.map((m: any) => ({
          id: m.id,
          user_id: m.user_id,
          school_id: m.school_id,
          status: m.status
        })), null, 2));
      }

      // Log event_participants in detail
      if (table === 'event_participants' && created.length > 0) {
        console.log(`[SYNC:USER]   event_participants created:`, JSON.stringify(created.map((p: any) => ({
          id: p.id,
          event_id: p.event_id,
          school_member_id: p.school_member_id,
          status: p.status
        })), null, 2));
      }
    }
  }
  console.log(`[SYNC:USER] ========================================`);
  console.log(`[SYNC:USER] Sync completed for user: ${userId}`);

  return {
    changes: pullChanges,
    timestamp: pullTimestamp,
  };
}
