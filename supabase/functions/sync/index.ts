/**
 * Sync endpoint - routes to appropriate sync logic based on user type
 *
 * Two sync modes:
 * 1. Organization Owner (instructor) → syncOrganization()
 * 2. Regular User (student) → syncUser()
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";
import { SyncPushChanges, SyncContext } from "./types.ts";
import { columnMigratedTables } from "./utils.ts";
import { syncOrganization } from "./sync-organization.ts";
import { syncUser } from "./sync-user.ts";

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // =========================================================================
    // AUTHENTICATION
    // =========================================================================
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

    // Extract JWT token
    const token = authHeader.replace("Bearer ", "");

    // Create Supabase admin client for JWT verification and database operations
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
      console.error("[SYNC] Auth verification failed:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: userError?.message }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Parse request body
    const body: SyncPushChanges = await req.json();
    const { changes, lastPulledAt, migration } = body;

    console.log(`[SYNC] Starting sync for user: ${user.id}`);

    // =========================================================================
    // ROUTE TO APPROPRIATE SYNC LOGIC
    // =========================================================================

    // Check if user owns an organization
    const { data: userOrg, error: orgError } = await supabaseAdmin
      .from("organizations")
      .select("id")
      .eq("owner_id", user.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (orgError) {
      console.error("[SYNC] Error fetching user organization:", orgError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch organization" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Writes go through a client that names the verified user, so database
    // triggers (e.g. notifications) can tell who acted even with the service role.
    const supabaseActor = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { global: { headers: { "x-evolync-actor": user.id } } },
    );

    // Prepare context for sync functions
    const syncContext: SyncContext = {
      supabaseClient: supabaseActor,
      userId: user.id,
      changes,
      lastPulledAt,
      migratedTables: migration?.tables ?? [],
      columnMigratedTables: columnMigratedTables(migration),
    };

    let result;

    if (userOrg) {
      // ORGANIZATION OWNER MODE: Sync entire organization
      console.log(`[SYNC] Mode: ORGANIZATION (${userOrg.id})`);
      result = await syncOrganization(syncContext);
    } else {
      // USER MODE: Sync only user's school memberships
      console.log(`[SYNC] Mode: USER`);
      result = await syncUser(syncContext);
    }

    // Return sync result
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[SYNC] Sync error:", error);
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
