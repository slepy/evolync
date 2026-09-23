import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

const SCHEMA_VERSION = 1;

interface SyncPullChanges {
  changes: Record<
    string,
    { created: any[]; updated: any[]; deleted: string[] }
  >;
  timestamp: number;
}

interface SyncPushChanges {
  changes: Record<
    string,
    { created: any[]; updated: any[]; deleted: string[] }
  >;
  lastPulledAt: number;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Extract JWT token from Authorization header
    const token = authHeader.replace("Bearer ", "");

    // Create Supabase admin client for verifying JWT and database operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Verify JWT token
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      console.error("Auth verification failed:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: userError?.message }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    // Use admin client for all database operations (bypasses RLS)
    const supabaseClient = supabaseAdmin;

    // Parse request body
    const body: SyncPushChanges = await req.json();
    const { changes, lastPulledAt } = body;

    // ===========================================================================
    // GET USER'S ORGANIZATION
    // ===========================================================================
    // Fetch the organization owned by the current user to filter sync data
    const { data: userOrg, error: orgError } = await supabaseClient
      .from("organizations")
      .select("id")
      .eq("owner_id", user.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (orgError) {
      console.error("Error fetching user organization:", orgError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch organization" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // If user has no organization, return empty changes
    if (!userOrg) {
      console.log(`[SYNC] User ${user.id} has no organization, returning empty changes`);
      return new Response(
        JSON.stringify({
          changes: {},
          timestamp: Date.now(),
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const organizationId = userOrg.id;
    console.log(`[SYNC] Syncing for organization: ${organizationId}`);

    // Define table processing order to respect foreign key dependencies
    // Parent tables must be processed before child tables
    // Used for both PUSH and PULL operations
    const tablesToSync = [
      "organizations",
      "organization_gradings",
      "schools",
      "school_settings",
      "school_invites",
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

    // Track payment_cycle IDs that were skipped due to duplicates
    // so we can also skip their related payment_records
    const skippedPaymentCycleIds = new Set<string>();

    // Process tables in dependency order
    for (const tableName of tablesToSync) {
      const tableChanges = changes[tableName];
      if (!tableChanges) continue;

      let { created, updated, deleted } = tableChanges;

      // For payment_records, filter out any that reference skipped cycles
      if (tableName === "payment_records" && skippedPaymentCycleIds.size > 0) {
        const originalCount = created.length;
        created = created.filter(
          (record) => !skippedPaymentCycleIds.has(record.payment_cycle_id),
        );
        if (created.length < originalCount) {
          console.log(
            `[SYNC] Filtered ${originalCount - created.length} payment_records referencing skipped cycles`,
          );
        }
      }

      // Insert created records
      if (created.length > 0) {
        console.log(
          `[SYNC] Processing ${created.length} created records for ${tableName}`,
        );

        // For payment_cycles, check for duplicates first and track skipped IDs
        if (tableName === "payment_cycles") {
          const recordsToInsert: any[] = [];

          for (const record of created) {
            const supabaseRecord = convertToSupabaseRecord(record, tableName);

            // Check if a cycle with the same school_id + period already exists
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
                `[SYNC] Skipping duplicate payment_cycle ${record.id} (existing: ${existing.id})`,
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
              console.error(`Error inserting to ${tableName}:`, error);
              throw new Error(
                `Failed to insert to ${tableName}: ${error.message}`,
              );
            }
          }
        } else if (tableName === "payment_records") {
          // Special handling for payment_records: verify payment_cycle_id exists
          const records = created.map((record) =>
            convertToSupabaseRecord(record, tableName),
          );

          // Get unique payment_cycle_ids from records
          const cycleIds = [
            ...new Set(records.map((r: any) => r.payment_cycle_id)),
          ];

          // Check which cycles actually exist in the database
          const { data: existingCycles } = await supabaseClient
            .from("payment_cycles")
            .select("id")
            .in("id", cycleIds)
            .is("deleted_at", null);

          const existingCycleIds = new Set(
            (existingCycles || []).map((c: any) => c.id),
          );

          // Filter out records referencing non-existent cycles
          const validRecords = records.filter((record: any) =>
            existingCycleIds.has(record.payment_cycle_id),
          );

          const skippedCount = records.length - validRecords.length;
          if (skippedCount > 0) {
            console.log(
              `[SYNC] Skipped ${skippedCount} payment_records with non-existent payment_cycle_id`,
            );
          }

          if (validRecords.length > 0) {
            const { error } = await supabaseClient
              .from(tableName)
              .upsert(validRecords, { ignoreDuplicates: true });

            if (error) {
              console.error(`Error inserting to ${tableName}:`, error);
              throw new Error(
                `Failed to insert to ${tableName}: ${error.message}`,
              );
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
            console.error(`Error inserting to ${tableName}:`, error);
            throw new Error(
              `Failed to insert to ${tableName}: ${error.message}`,
            );
          }
        }
      }

      // Update existing records
      if (updated.length > 0) {
        // For payment_records, validate payment_cycle_id exists before updating
        if (tableName === "payment_records") {
          const cycleIds = [
            ...new Set(updated.map((r: any) => r.payment_cycle_id)),
          ];

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
                `[SYNC] Skipping update for payment_record ${record.id} - cycle ${record.payment_cycle_id} not found`,
              );
              continue;
            }

            const supabaseRecord = convertToSupabaseRecord(record, tableName);
            const { error } = await supabaseClient
              .from(tableName)
              .update(supabaseRecord)
              .eq("id", record.id);

            if (error) {
              console.error(`Error updating ${tableName}:`, error);
              throw new Error(
                `Failed to update ${tableName}: ${error.message}`,
              );
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
              console.error(`Error updating ${tableName}:`, error);
              throw new Error(
                `Failed to update ${tableName}: ${error.message}`,
              );
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
          console.error(`Error deleting from ${tableName}:`, error);
          throw new Error(
            `Failed to delete from ${tableName}: ${error.message}`,
          );
        }
      }
    }

    // ===========================================================================
    // PULL: Fetch changes from Supabase since lastPulledAt (STEP BY STEP)
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
        console.error(`Error fetching from ${tableName}:`, error);
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
        console.error(`Error fetching deleted from ${tableName}:`, deletedError);
        throw new Error(`Failed to fetch deleted from ${tableName}: ${deletedError.message}`);
      }

      const deleted = (deletedRecords || []).map((r) => r.id);

      return { created, updated, deleted };
    };

    // -------------------------------------------------------------------------
    // STEP 1: Organizations (filtered by owner)
    // -------------------------------------------------------------------------
    pullChanges.organizations = await fetchTableChanges("organizations", (q) =>
      q.eq("id", organizationId),
    );

    // -------------------------------------------------------------------------
    // STEP 1b: Organization gradings (filtered by organization)
    // -------------------------------------------------------------------------
    pullChanges.organization_gradings = await fetchTableChanges("organization_gradings", (q) =>
      q.eq("organization_id", organizationId),
    );

    // -------------------------------------------------------------------------
    // STEP 2: Schools & Products (filtered by organization)
    // -------------------------------------------------------------------------
    pullChanges.schools = await fetchTableChanges("schools", (q) =>
      q.eq("organization_id", organizationId),
    );

    pullChanges.products = await fetchTableChanges("products", (q) =>
      q.eq("organization_id", organizationId),
    );

    // Get school IDs for next steps
    const { data: orgSchools } = await supabaseClient
      .from("schools")
      .select("id")
      .eq("organization_id", organizationId)
      .is("deleted_at", null);
    const schoolIds = (orgSchools || []).map((s: any) => s.id);

    // Get product IDs for next steps
    const { data: orgProducts } = await supabaseClient
      .from("products")
      .select("id")
      .eq("organization_id", organizationId)
      .is("deleted_at", null);
    const productIds = (orgProducts || []).map((p: any) => p.id);

    // -------------------------------------------------------------------------
    // STEP 3: School-dependent tables
    // -------------------------------------------------------------------------
    if (schoolIds.length > 0) {
      pullChanges.school_settings = await fetchTableChanges("school_settings", (q) =>
        q.in("school_id", schoolIds),
      );
      pullChanges.school_invites = await fetchTableChanges("school_invites", (q) =>
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
      // No schools - empty results for school-dependent tables
      pullChanges.school_settings = { created: [], updated: [], deleted: [] };
      pullChanges.school_invites = { created: [], updated: [], deleted: [] };
      pullChanges.school_members = { created: [], updated: [], deleted: [] };
      pullChanges.orders = { created: [], updated: [], deleted: [] };
      pullChanges.payment_cycles = { created: [], updated: [], deleted: [] };
      pullChanges.training_sessions = { created: [], updated: [], deleted: [] };
    }

    // -------------------------------------------------------------------------
    // STEP 4: Product variants (filtered by product)
    // -------------------------------------------------------------------------
    if (productIds.length > 0) {
      pullChanges.product_variants = await fetchTableChanges("product_variants", (q) =>
        q.in("product_id", productIds),
      );
    } else {
      pullChanges.product_variants = { created: [], updated: [], deleted: [] };
    }

    // -------------------------------------------------------------------------
    // STEP 5: Order items (filtered by orders)
    // -------------------------------------------------------------------------
    const { data: orgOrders } = await supabaseClient
      .from("orders")
      .select("id")
      .in("school_id", schoolIds.length > 0 ? schoolIds : [organizationId]) // fallback won't match
      .is("deleted_at", null);
    const orderIds = (orgOrders || []).map((o: any) => o.id);

    if (orderIds.length > 0) {
      pullChanges.order_items = await fetchTableChanges("order_items", (q) =>
        q.in("order_id", orderIds),
      );
    } else {
      pullChanges.order_items = { created: [], updated: [], deleted: [] };
    }

    // -------------------------------------------------------------------------
    // STEP 6: Payment records (filtered by payment cycles)
    // -------------------------------------------------------------------------
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

    // -------------------------------------------------------------------------
    // STEP 7: Attendance records (filtered by training sessions)
    // -------------------------------------------------------------------------
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

    // -------------------------------------------------------------------------
    // STEP 8: Events (filtered by organization)
    // -------------------------------------------------------------------------
    pullChanges.events = await fetchTableChanges("events", (q) =>
      q.eq("organization_id", organizationId),
    );

    // -------------------------------------------------------------------------
    // STEP 9: Event participants (filtered by events)
    // -------------------------------------------------------------------------
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
    // RESPONSE
    // ===========================================================================

    const response: SyncPullChanges = {
      changes: pullChanges,
      timestamp: Date.now(),
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

/**
 * Convert WatermelonDB record to Supabase format
 * - Timestamps: Convert from ms to ISO string, or delete if 0/falsy to use DB defaults
 * - Field names: Convert snake_case to match Supabase schema
 * - Invalid values: Convert "undefined" string to null for nullable fields
 */
function convertToSupabaseRecord(record: any, tableName: string): any {
  const supabaseRecord: any = { ...record };

  // Helper to convert timestamp - returns ISO string or deletes the field
  // If value is 0 or falsy, delete the field so PostgreSQL uses DEFAULT now()
  const convertOrDeleteTimestamp = (fieldName: string) => {
    const value = record[fieldName];
    if (value && value > 0) {
      supabaseRecord[fieldName] = new Date(value).toISOString();
    } else {
      // Delete field to let PostgreSQL use DEFAULT value
      delete supabaseRecord[fieldName];
    }
  };

  // Convert timestamps from milliseconds to ISO strings
  convertOrDeleteTimestamp("created_at");
  convertOrDeleteTimestamp("updated_at");
  convertOrDeleteTimestamp("deleted_at");
  convertOrDeleteTimestamp("joined_at");
  convertOrDeleteTimestamp("payment_date");
  convertOrDeleteTimestamp("period_start");
  convertOrDeleteTimestamp("period_end");
  convertOrDeleteTimestamp("expires_at");

  // Convert date fields (stored as timestamp in WatermelonDB, needs DATE format for PostgreSQL)
  // These are DATE type columns, not TIMESTAMP, so we only need YYYY-MM-DD
  if (record.date && typeof record.date === "number") {
    supabaseRecord.date = new Date(record.date).toISOString().split("T")[0];
  }
  if (record.start_date && typeof record.start_date === "number") {
    supabaseRecord.start_date = new Date(record.start_date).toISOString().split("T")[0];
  }
  if (record.end_date && typeof record.end_date === "number") {
    supabaseRecord.end_date = new Date(record.end_date).toISOString().split("T")[0];
  }

  // Convert "undefined" string to null for all fields
  // This happens when WatermelonDB serializes JavaScript undefined values
  for (const [key, value] of Object.entries(supabaseRecord)) {
    if (value === "undefined") {
      supabaseRecord[key] = null;
    }
  }

  // Remove WatermelonDB internal fields
  delete supabaseRecord._status;
  delete supabaseRecord._changed;

  return supabaseRecord;
}

/**
 * Convert Supabase record to WatermelonDB format
 * - Timestamps: Convert from ISO string to ms
 * - Field names: Already in snake_case (matches WatermelonDB schema)
 */
function convertToWatermelonRecord(record: any, tableName: string): any {
  const watermelonRecord: any = { ...record };

  // Convert timestamps from ISO strings to milliseconds
  if (record.created_at) {
    watermelonRecord.created_at = new Date(record.created_at).getTime();
  }
  if (record.updated_at) {
    watermelonRecord.updated_at = new Date(record.updated_at).getTime();
  }
  if (record.deleted_at) {
    watermelonRecord.deleted_at = new Date(record.deleted_at).getTime();
  }
  if (record.joined_at) {
    watermelonRecord.joined_at = new Date(record.joined_at).getTime();
  }
  if (record.payment_date) {
    watermelonRecord.payment_date = new Date(record.payment_date).getTime();
  }
  if (record.period_start) {
    watermelonRecord.period_start = new Date(record.period_start).getTime();
  }
  if (record.period_end) {
    watermelonRecord.period_end = new Date(record.period_end).getTime();
  }
  if (record.expires_at) {
    watermelonRecord.expires_at = new Date(record.expires_at).getTime();
  }

  // Convert date fields (stored as DATE string in PostgreSQL, needs timestamp for WatermelonDB)
  if (record.date && typeof record.date === "string") {
    watermelonRecord.date = new Date(record.date).getTime();
  }
  if (record.start_date && typeof record.start_date === "string") {
    watermelonRecord.start_date = new Date(record.start_date).getTime();
  }
  if (record.end_date && typeof record.end_date === "string") {
    watermelonRecord.end_date = new Date(record.end_date).getTime();
  }

  return watermelonRecord;
}
