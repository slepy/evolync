/**
 * Sync logic for ORGANIZATIONS (users who own an organization)
 *
 * Syncs entire organization data:
 * - All schools in the organization
 * - All students, payments, orders, attendance
 * - All products and inventory
 */

import { SyncContext, SyncPullChanges } from "./types.ts";
import { convertToSupabaseRecord, convertToWatermelonRecord } from "./utils.ts";
import { pushThreeDChanges, pullThreeDChanges } from "./sync-threed.ts";
import { pushNotesChanges, pullNotesChanges } from "./sync-notes.ts";
import { pushTagsChanges, pullTagsChanges } from "./sync-tags.ts";
import { pushNotificationsChanges, pullNotificationsChanges } from "./sync-notifications.ts";

export async function syncOrganization(ctx: SyncContext): Promise<SyncPullChanges> {
  const { supabaseClient, userId, changes, lastPulledAt } = ctx;

  // Get user's organization
  const { data: userOrg, error: orgError } = await supabaseClient
    .from("organizations")
    .select("id")
    .eq("owner_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (orgError || !userOrg) {
    throw new Error("Organization not found for organization owner");
  }

  const organizationId = userOrg.id;
  console.log(`[SYNC:ORGANIZATION] Syncing organization: ${organizationId}`);

  // Define table processing order to respect foreign key dependencies
  const tablesToSync = [
    "organizations",
    "organization_gradings",
    "schools",
    "school_settings",
    "school_invites",
    "school_join_requests",
    "school_members",
    "products",
    "product_variants",
    "orders",
    "order_items",
    "payment_cycles",
    "payment_records",
    "training_sessions",
    "attendance_records",
    "events",
    "event_participants",
  ];

  // ===========================================================================
  // PUSH: Apply incoming changes from client to Supabase
  // ===========================================================================

  const skippedPaymentCycleIds = new Set<string>();

  for (const tableName of tablesToSync) {
    const tableChanges = changes[tableName];
    if (!tableChanges) continue;

    let { created, updated, deleted } = tableChanges;

    // Filter payment_records referencing skipped cycles
    if (tableName === "payment_records" && skippedPaymentCycleIds.size > 0) {
      const originalCount = created.length;
      created = created.filter(
        (record) => !skippedPaymentCycleIds.has(record.payment_cycle_id),
      );
      if (created.length < originalCount) {
        console.log(
          `[SYNC:ORGANIZATION] Filtered ${originalCount - created.length} payment_records referencing skipped cycles`,
        );
      }
    }

    // Insert created records
    if (created.length > 0) {
      console.log(
        `[SYNC:ORGANIZATION] Processing ${created.length} created records for ${tableName}`,
      );

      if (tableName === "payment_cycles") {
        // Check for duplicates
        const recordsToInsert: any[] = [];

        for (const record of created) {
          const supabaseRecord = convertToSupabaseRecord(record, tableName);

          const { data: existing } = await supabaseClient
            .from("payment_cycles")
            .select("id")
            .eq("school_id", supabaseRecord.school_id)
            .eq("period_start", supabaseRecord.period_start)
            .eq("period_end", supabaseRecord.period_end)
            .is("deleted_at", null)
            .maybeSingle();

          if (existing) {
            console.log(
              `[SYNC:ORGANIZATION] Skipping duplicate payment_cycle ${record.id}`,
            );
            skippedPaymentCycleIds.add(record.id);
          } else {
            recordsToInsert.push(supabaseRecord);
          }
        }

        if (recordsToInsert.length > 0) {
          const { error } = await supabaseClient
            .from(tableName)
            .upsert(recordsToInsert);

          if (error) {
            throw new Error(`Failed to insert to ${tableName}: ${error.message}`);
          }
        }
      } else if (tableName === "payment_records") {
        // Verify payment_cycle_id exists
        const records = created.map((record) =>
          convertToSupabaseRecord(record, tableName),
        );

        const cycleIds = [...new Set(records.map((r: any) => r.payment_cycle_id))];

        const { data: existingCycles } = await supabaseClient
          .from("payment_cycles")
          .select("id")
          .in("id", cycleIds)
          .is("deleted_at", null);

        const existingCycleIds = new Set(
          (existingCycles || []).map((c: any) => c.id),
        );

        const validRecords = records.filter((record: any) =>
          existingCycleIds.has(record.payment_cycle_id),
        );

        if (validRecords.length > 0) {
          const { error } = await supabaseClient
            .from(tableName)
            .upsert(validRecords, { ignoreDuplicates: true });

          if (error) {
            throw new Error(`Failed to insert to ${tableName}: ${error.message}`);
          }
        }
      } else {
        // Standard upsert for other tables
        const records = created.map((record) =>
          convertToSupabaseRecord(record, tableName),
        );

        const { error } = await supabaseClient
          .from(tableName)
          .upsert(records);

        if (error) {
          throw new Error(`Failed to insert to ${tableName}: ${error.message}`);
        }
      }
    }

    // Update existing records
    if (updated.length > 0) {
      if (tableName === "payment_records") {
        const cycleIds = [...new Set(updated.map((r: any) => r.payment_cycle_id))];

        const { data: existingCycles } = await supabaseClient
          .from("payment_cycles")
          .select("id")
          .in("id", cycleIds)
          .is("deleted_at", null);

        const existingCycleIds = new Set(
          (existingCycles || []).map((c: any) => c.id),
        );

        for (const record of updated) {
          if (!existingCycleIds.has(record.payment_cycle_id)) {
            console.log(
              `[SYNC:ORGANIZATION] Skipping update for payment_record ${record.id}`,
            );
            continue;
          }

          const supabaseRecord = convertToSupabaseRecord(record, tableName);
          const { error } = await supabaseClient
            .from(tableName)
            .update(supabaseRecord)
            .eq("id", record.id);

          if (error) {
            throw new Error(`Failed to update ${tableName}: ${error.message}`);
          }
        }
      } else {
        for (const record of updated) {
          const supabaseRecord = convertToSupabaseRecord(record, tableName);
          const { error } = await supabaseClient
            .from(tableName)
            .update(supabaseRecord)
            .eq("id", record.id);

          if (error) {
            throw new Error(`Failed to update ${tableName}: ${error.message}`);
          }
        }
      }
    }

    // Soft delete records
    if (deleted.length > 0) {
      const { error } = await supabaseClient
        .from(tableName)
        .update({ deleted_at: new Date().toISOString() })
        .in("id", deleted);

      if (error) {
        throw new Error(`Failed to delete from ${tableName}: ${error.message}`);
      }
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
    let query = supabaseClient
      .from(tableName)
      .select("*")
      .or(`created_at.gte.${lastPulledDate},updated_at.gte.${lastPulledDate}`)
      .is("deleted_at", null);

    if (filterFn) {
      query = filterFn(query);
    }

    const { data: records, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch from ${tableName}: ${error.message}`);
    }

    const created: any[] = [];
    const updated: any[] = [];

    for (const record of records || []) {
      const createdAt = new Date(record.created_at).getTime();
      const updatedAt = new Date(record.updated_at).getTime();
      const watermelonRecord = convertToWatermelonRecord(record, tableName);

      if (createdAt > lastPulledAt) {
        created.push(watermelonRecord);
      } else if (updatedAt > lastPulledAt) {
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
      throw new Error(`Failed to fetch deleted from ${tableName}: ${deletedError.message}`);
    }

    const deleted = (deletedRecords || []).map((r) => r.id);

    return { created, updated, deleted };
  };

  // Fetch all data for organization
  pullChanges.organizations = await fetchTableChanges("organizations", (q) =>
    q.eq("id", organizationId),
  );

  pullChanges.organization_roles = await fetchTableChanges("organization_roles", (q) =>
    q.eq("organization_id", organizationId),
  );

  pullChanges.organization_gradings = await fetchTableChanges("organization_gradings", (q) =>
    q.eq("organization_id", organizationId),
  );

  pullChanges.schools = await fetchTableChanges("schools", (q) =>
    q.eq("organization_id", organizationId),
  );

  pullChanges.products = await fetchTableChanges("products", (q) =>
    q.eq("organization_id", organizationId),
  );

  // Get school IDs and product IDs for child tables
  const { data: orgSchools } = await supabaseClient
    .from("schools")
    .select("id")
    .eq("organization_id", organizationId)
    .is("deleted_at", null);
  const schoolIds = (orgSchools || []).map((s: any) => s.id);

  const { data: orgProducts } = await supabaseClient
    .from("products")
    .select("id")
    .eq("organization_id", organizationId)
    .is("deleted_at", null);
  const productIds = (orgProducts || []).map((p: any) => p.id);

  // Fetch school-dependent tables
  if (schoolIds.length > 0) {
    pullChanges.school_settings = await fetchTableChanges("school_settings", (q) =>
      q.in("school_id", schoolIds),
    );
    pullChanges.school_invites = await fetchTableChanges("school_invites", (q) =>
      q.in("school_id", schoolIds),
    );
    pullChanges.school_join_requests = await fetchTableChanges("school_join_requests", (q) =>
      q.in("school_id", schoolIds),
    );
    pullChanges.school_members = await fetchTableChanges("school_members", (q) =>
      q.in("school_id", schoolIds),
    );
    pullChanges.orders = await fetchTableChanges("orders", (q) =>
      q.in("school_id", schoolIds),
    );
    pullChanges.payment_cycles = await fetchTableChanges("payment_cycles", (q) =>
      q.in("school_id", schoolIds),
    );
    pullChanges.training_sessions = await fetchTableChanges("training_sessions", (q) =>
      q.in("school_id", schoolIds),
    );
  } else {
    pullChanges.school_settings = { created: [], updated: [], deleted: [] };
    pullChanges.school_invites = { created: [], updated: [], deleted: [] };
    pullChanges.school_join_requests = { created: [], updated: [], deleted: [] };
    pullChanges.school_members = { created: [], updated: [], deleted: [] };
    pullChanges.orders = { created: [], updated: [], deleted: [] };
    pullChanges.payment_cycles = { created: [], updated: [], deleted: [] };
    pullChanges.training_sessions = { created: [], updated: [], deleted: [] };
  }

  // Product variants
  if (productIds.length > 0) {
    pullChanges.product_variants = await fetchTableChanges("product_variants", (q) =>
      q.in("product_id", productIds),
    );
  } else {
    pullChanges.product_variants = { created: [], updated: [], deleted: [] };
  }

  // Order items
  const { data: orgOrders } = await supabaseClient
    .from("orders")
    .select("id")
    .in("school_id", schoolIds.length > 0 ? schoolIds : [organizationId])
    .is("deleted_at", null);
  const orderIds = (orgOrders || []).map((o: any) => o.id);

  if (orderIds.length > 0) {
    pullChanges.order_items = await fetchTableChanges("order_items", (q) =>
      q.in("order_id", orderIds),
    );
  } else {
    pullChanges.order_items = { created: [], updated: [], deleted: [] };
  }

  // Payment records
  const { data: orgPaymentCycles } = await supabaseClient
    .from("payment_cycles")
    .select("id")
    .in("school_id", schoolIds.length > 0 ? schoolIds : [organizationId])
    .is("deleted_at", null);
  const paymentCycleIds = (orgPaymentCycles || []).map((c: any) => c.id);

  if (paymentCycleIds.length > 0) {
    pullChanges.payment_records = await fetchTableChanges("payment_records", (q) =>
      q.in("payment_cycle_id", paymentCycleIds),
    );
  } else {
    pullChanges.payment_records = { created: [], updated: [], deleted: [] };
  }

  // Attendance records
  const { data: orgSessions } = await supabaseClient
    .from("training_sessions")
    .select("id")
    .in("school_id", schoolIds.length > 0 ? schoolIds : [organizationId])
    .is("deleted_at", null);
  const sessionIds = (orgSessions || []).map((s: any) => s.id);

  if (sessionIds.length > 0) {
    pullChanges.attendance_records = await fetchTableChanges("attendance_records", (q) =>
      q.in("training_session_id", sessionIds),
    );
  } else {
    pullChanges.attendance_records = { created: [], updated: [], deleted: [] };
  }

  // Events
  pullChanges.events = await fetchTableChanges("events", (q) =>
    q.eq("organization_id", organizationId),
  );

  const { data: orgEvents } = await supabaseClient
    .from("events")
    .select("id")
    .eq("organization_id", organizationId)
    .is("deleted_at", null);
  const eventIds = (orgEvents || []).map((e: any) => e.id);

  if (eventIds.length > 0) {
    pullChanges.event_participants = await fetchTableChanges("event_participants", (q) =>
      q.in("event_id", eventIds),
    );
  } else {
    pullChanges.event_participants = { created: [], updated: [], deleted: [] };
  }

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

  return {
    changes: pullChanges,
    timestamp: Date.now(),
  };
}
