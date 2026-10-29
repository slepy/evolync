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
import {
  convertToSupabaseRecord,
  convertToWatermelonRecord,
  MEMBER_SCHOOL_TABLES,
  membershipChangedSince,
  PULL_TIMESTAMP_MARGIN_MS,
  ownMembershipPush,
  studentOrderPush,
  studentParticipantPush,
} from "./utils.ts";
import { pushThreeDChanges, pullThreeDChanges } from "./sync-threed.ts";
import { pushNotesChanges, pullNotesChanges } from "./sync-notes.ts";
import { pushTagsChanges, pullTagsChanges } from "./sync-tags.ts";
import { pushNotificationsChanges, pullNotificationsChanges } from "./sync-notifications.ts";
import { pullTrainingsForMember } from "./sync-trainings.ts";
import { pullEventTypesForMember } from "./sync-event-types.ts";

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

  // Tables that users can sync (limited to their data only)
  const tablesToSync = [
    "school_join_requests", // Their own join requests
    "school_members", // Only their own records
    "orders", // Their orders
    "order_items", // Items in their orders
    "payment_records", // Their payments
    "attendance_records", // Their attendance
    "event_participants", // Events they're in
  ];

  // ===========================================================================
  // PUSH: Apply incoming changes from client to Supabase
  // ===========================================================================

  for (const tableName of tablesToSync) {
    const tableChanges = changes[tableName];
    if (!tableChanges) continue;

    const { created, updated, deleted } = tableChanges;

    // Security: Filter to only allow user's own data
    const filterUserData = (records: any[]) => {
      switch (tableName) {
        case "school_join_requests":
          // Only their own join requests
          return records.filter((r: any) => r.user_id === userId);

        case "school_members":
          return ownMembershipPush(records, userId);

        case "orders":
          return studentOrderPush(records);

        case "event_participants":
          return studentParticipantPush(records);

        case "order_items":
        case "payment_records":
        case "attendance_records":
          // These will be validated by foreign key constraints in Supabase
          // If user tries to insert data they don't own, FK constraint will fail
          return records;

        default:
          return [];
      }
    };

    // Insert created records
    if (created.length > 0) {
      const filteredCreated = filterUserData(created);

      if (filteredCreated.length > 0) {
        console.log(
          `[SYNC:USER] Processing ${filteredCreated.length} created records for ${tableName}`,
        );

        const records = filteredCreated.map((record) =>
          convertToSupabaseRecord(record, tableName),
        );

        const { error } = await supabaseClient
          .from(tableName)
          .upsert(records);

        if (error) {
          console.error(`[SYNC:USER] Failed to insert to ${tableName}:`, error);
          // Don't throw - continue with other tables
        }
      }
    }

    // Update existing records
    if (updated.length > 0) {
      const filteredUpdated = filterUserData(updated);

      if (filteredUpdated.length > 0) {
        console.log(
          `[SYNC:USER] Processing ${filteredUpdated.length} updated records for ${tableName}`,
        );

        for (const record of filteredUpdated) {
          const supabaseRecord = convertToSupabaseRecord(record, tableName);
          const { error } = await supabaseClient
            .from(tableName)
            .update(supabaseRecord)
            .eq("id", record.id);

          if (error) {
            console.error(`[SYNC:USER] Failed to update ${tableName}:`, error);
            // Don't throw - continue with other records
          }
        }
      }
    }

    // Soft delete records
    if (deleted.length > 0) {
      // Users generally can't delete records, but handle it for completeness
      console.log(
        `[SYNC:USER] Skipping ${deleted.length} deletes for ${tableName} (users cannot delete)`,
      );
    }
  }

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

  const { data: memberships, error: memberError } = await supabaseClient
    .from("school_members")
    .select("school_id, id, status, created_at, updated_at")
    .eq("user_id", userId)
    .is("deleted_at", null);

  if (memberError) {
    throw new Error(`Failed to fetch memberships: ${memberError.message}`);
  }

  const schoolIds = (memberships || []).map((m: any) => m.school_id);
  const membershipChanged = membershipChangedSince(memberships || [], lastPulledAt);
  const memberIds = (memberships || []).map((m: any) => m.id);

  console.log(`[SYNC:USER] ========================================`);
  console.log(`[SYNC:USER] User ${userId} memberships after PUSH:`);
  console.log(`[SYNC:USER] - Total schools: ${schoolIds.length}`);
  console.log(`[SYNC:USER] - Member IDs: ${JSON.stringify(memberIds)}`);
  console.log(`[SYNC:USER] - School IDs: ${JSON.stringify(schoolIds)}`);
  console.log(`[SYNC:USER] - Full memberships:`, JSON.stringify(memberships, null, 2));
  console.log(`[SYNC:USER] ========================================`);

  // If user has no schools, return empty changes
  if (schoolIds.length === 0) {
    console.log(`[SYNC:USER] User ${userId} has no schools, returning notifications only`);
    return {
      changes: await pullNotificationsChanges(ctx),
      timestamp: pullTimestamp,
    };
  }

  // ===========================================================================
  // PULL: Fetch changes from Supabase since lastPulledAt
  // ===========================================================================
  const lastPulledDate = new Date(lastPulledAt).toISOString();
  const pullChanges: Record<
    string,
    { created: any[]; updated: any[]; deleted: string[] }
  > = {};

  // Helper to fetch and categorize records for a table
  const fetchTableChanges = async (
    tableName: string,
    filterFn?: (query: any) => any,
  ) => {
    const fullPull =
      (ctx.columnMigratedTables ?? []).includes(tableName) ||
      (membershipChanged && MEMBER_SCHOOL_TABLES.includes(tableName));
    let query = supabaseClient.from(tableName).select("*").is("deleted_at", null);
    if (!fullPull) {
      query = query.or(`created_at.gte.${lastPulledDate},updated_at.gte.${lastPulledDate}`);
    }

    if (filterFn) {
      query = filterFn(query);
    }

    const { data: records, error } = await query;

    if (error) {
      console.error(`[SYNC:USER] Error fetching ${tableName}:`, error);
      return { created: [], updated: [], deleted: [] };
    }

    const created: any[] = [];
    const updated: any[] = [];

    for (const record of records || []) {
      const createdAt = new Date(record.created_at).getTime();
      const updatedAt = new Date(record.updated_at).getTime();
      const watermelonRecord = convertToWatermelonRecord(record, tableName);

      if (createdAt > lastPulledAt) {
        created.push(watermelonRecord);
      } else if (updatedAt > lastPulledAt || fullPull) {
        updated.push(watermelonRecord);
      }
    }

    // Fetch deleted records
    let deletedQuery = supabaseClient
      .from(tableName)
      .select("id")
      .gte("deleted_at", lastPulledDate)
      .not("deleted_at", "is", null);

    if (filterFn) {
      deletedQuery = filterFn(deletedQuery);
    }

    const { data: deletedRecords, error: deletedError } = await deletedQuery;

    if (deletedError) {
      console.error(`[SYNC:USER] Error fetching deleted ${tableName}:`, deletedError);
      return { created, updated, deleted: [] };
    }

    const deleted = (deletedRecords || []).map((r: any) => r.id);

    return { created, updated, deleted };
  };

  // Get organization IDs for the schools (to fetch products)
  const { data: schools } = await supabaseClient
    .from("schools")
    .select("id, name, organization_id")
    .in("id", schoolIds)
    .is("deleted_at", null);

  const organizationIds: string[] = [...new Set<string>((schools || []).map((s: any) => s.organization_id))];

  // Fetch schools user belongs to
  pullChanges.schools = await fetchTableChanges("schools", (q) =>
    q.in("id", schoolIds),
  );

  // Fetch school settings for these schools
  pullChanges.school_settings = await fetchTableChanges("school_settings", (q) =>
    q.in("school_id", schoolIds),
  );

  // Fetch ALL members for schools they belong to (so they can see other students)
  pullChanges.school_members = await fetchTableChanges("school_members", (q) =>
    q.in("school_id", schoolIds),
  );

  // Fetch payment cycles for these schools
  pullChanges.payment_cycles = await fetchTableChanges("payment_cycles", (q) =>
    q.in("school_id", schoolIds),
  );

  // Get payment cycle IDs
  const { data: paymentCycles } = await supabaseClient
    .from("payment_cycles")
    .select("id")
    .in("school_id", schoolIds)
    .is("deleted_at", null);
  const paymentCycleIds = (paymentCycles || []).map((c: any) => c.id);

  // Fetch payment records for their memberships
  if (memberIds.length > 0 && paymentCycleIds.length > 0) {
    pullChanges.payment_records = await fetchTableChanges("payment_records", (q) =>
      q.in("school_member_id", memberIds).in("payment_cycle_id", paymentCycleIds),
    );
  } else {
    pullChanges.payment_records = { created: [], updated: [], deleted: [] };
  }

  // Fetch training sessions for these schools
  pullChanges.training_sessions = await fetchTableChanges("training_sessions", (q) =>
    q.in("school_id", schoolIds),
  );

  // Get training session IDs
  const { data: trainingSessions } = await supabaseClient
    .from("training_sessions")
    .select("id")
    .in("school_id", schoolIds)
    .is("deleted_at", null);
  const sessionIds = (trainingSessions || []).map((s: any) => s.id);

  // Fetch attendance records for their memberships
  if (memberIds.length > 0 && sessionIds.length > 0) {
    pullChanges.attendance_records = await fetchTableChanges("attendance_records", (q) =>
      q.in("school_member_id", memberIds).in("training_session_id", sessionIds),
    );
  } else {
    pullChanges.attendance_records = { created: [], updated: [], deleted: [] };
  }

  // Fetch orders for their memberships
  if (memberIds.length > 0) {
    pullChanges.orders = await fetchTableChanges("orders", (q) =>
      q.in("school_member_id", memberIds).in("school_id", schoolIds),
    );
  } else {
    pullChanges.orders = { created: [], updated: [], deleted: [] };
  }

  // Get order IDs
  const { data: orders } = await supabaseClient
    .from("orders")
    .select("id")
    .in("school_member_id", memberIds.length > 0 ? memberIds : [""])
    .in("school_id", schoolIds)
    .is("deleted_at", null);
  const orderIds = (orders || []).map((o: any) => o.id);

  // Fetch order items
  if (orderIds.length > 0) {
    pullChanges.order_items = await fetchTableChanges("order_items", (q) =>
      q.in("order_id", orderIds),
    );
  } else {
    pullChanges.order_items = { created: [], updated: [], deleted: [] };
  }

  // Fetch products from school organizations (read-only for users)
  if (organizationIds.length > 0) {
    pullChanges.products = await fetchTableChanges("products", (q) =>
      q.in("organization_id", organizationIds),
    );

    // Get product IDs
    const { data: products } = await supabaseClient
      .from("products")
      .select("id")
      .in("organization_id", organizationIds)
      .is("deleted_at", null);
    const productIds = (products || []).map((p: any) => p.id);

    if (productIds.length > 0) {
      pullChanges.product_variants = await fetchTableChanges("product_variants", (q) =>
        q.in("product_id", productIds),
      );
    } else {
      pullChanges.product_variants = { created: [], updated: [], deleted: [] };
    }
  } else {
    pullChanges.products = { created: [], updated: [], deleted: [] };
    pullChanges.product_variants = { created: [], updated: [], deleted: [] };
  }

  // Fetch event_participants first (by membership), then related events
  if (memberIds.length > 0) {
    // Step 1: Get all event_participant records for this user's memberships
    const { data: participantRecords, error: partError } = await supabaseClient
      .from("event_participants")
      .select("event_id, school_member_id")
      .in("school_member_id", memberIds)
      .is("deleted_at", null);
    console.log(`[SYNC:USER] event_participants query: memberIds=${JSON.stringify(memberIds)}, found=${participantRecords?.length || 0}, error=${partError?.message || 'none'}, data=${JSON.stringify(participantRecords)}`);
    const eventIds: string[] = [...new Set<string>((participantRecords || []).map((p: any) => p.event_id))];
    console.log(`[SYNC:USER] User is participant in ${eventIds.length} event(s), eventIds=${JSON.stringify(eventIds)}`);

    if (eventIds.length > 0) {
      // Step 2: Fetch the events the user is assigned to
      pullChanges.events = await fetchTableChanges("events", (q) =>
        q.in("id", eventIds),
      );

      // Step 3: Fetch event_participants for those events (only this user's records)
      pullChanges.event_participants = await fetchTableChanges("event_participants", (q) =>
        q.in("event_id", eventIds).in("school_member_id", memberIds),
      );
      // Step 4: Types of those events (read-only), so the rows show the type name
      pullChanges.event_types = await pullEventTypesForMember(ctx, eventIds, [
        ...pullChanges.events.created,
        ...pullChanges.events.updated,
      ]);
      console.log(`[SYNC:USER] Events pulled: created=${pullChanges.events.created.length}, updated=${pullChanges.events.updated.length}`);
      console.log(`[SYNC:USER] Event participants pulled: created=${pullChanges.event_participants.created.length}, updated=${pullChanges.event_participants.updated.length}`);
    } else {
      pullChanges.events = { created: [], updated: [], deleted: [] };
      pullChanges.event_participants = { created: [], updated: [], deleted: [] };
      pullChanges.event_types = { created: [], updated: [], deleted: [] };
    }
  } else {
    pullChanges.events = { created: [], updated: [], deleted: [] };
    pullChanges.event_participants = { created: [], updated: [], deleted: [] };
    pullChanges.event_types = { created: [], updated: [], deleted: [] };
  }

  // Planned trainings the member is in the audience of (read-only)
  Object.assign(
    pullChanges,
    await pullTrainingsForMember(ctx, {
      memberIds,
      schoolIds,
      organizationIds,
      newMembership: membershipChanged,
    }),
  );

  // Pull user's own join requests (so they can see if request is still pending or was deleted/approved)
  pullChanges.school_join_requests = await fetchTableChanges("school_join_requests", (q) =>
    q.eq("user_id", userId),
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
