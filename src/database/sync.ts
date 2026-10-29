import { synchronize } from "@nozbe/watermelondb/sync";
import { database, resetLocalDatabase } from "./index";
import { resendPendingJoinRequestsOnce } from "./resendJoinRequests";

// Import supabase using require to avoid Metro bundler issues
const { supabase } = require("@/config/supabase");

// Get Supabase config for API calls
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Debug: Log if env vars are missing
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("[SYNC] Missing environment variables:", {
    SUPABASE_URL: !!SUPABASE_URL,
    SUPABASE_ANON_KEY: !!SUPABASE_ANON_KEY,
  });
}

/**
 * WatermelonDB Sync Configuration
 *
 * Implements offline-first synchronization between local WatermelonDB and Supabase.
 *
 * Architecture:
 * 1. All changes are made to local database first
 * 2. Sync process pushes local changes to Supabase
 * 3. Sync process pulls remote changes from Supabase
 * 4. "Last write wins" conflict resolution
 *
 * Sync triggers:
 * - On app launch (after authentication)
 * - When device comes online
 * - Manual trigger by user
 * - Periodic background sync (optional)
 */

export interface SyncResult {
  success: boolean;
  error?: string;
  timestamp: number;
}

// Sync lock to prevent concurrent synchronization
let isSyncing = false;
let syncPromise: Promise<SyncResult> | null = null;

export interface SyncOptions {
  /** Skip pulling organizations from server (used when organizations are preserved locally) */
  skipOrganizations?: boolean;
}

/**
 * Performs full database synchronization
 * Uses a lock to prevent concurrent sync operations
 *
 * @param options - Sync options
 * @returns Promise<SyncResult> - Result of sync operation
 */
export async function sync(options: SyncOptions = {}): Promise<SyncResult> {
  // If already syncing, return the existing promise
  if (isSyncing && syncPromise) {
    console.log(
      "[SYNC] Sync already in progress, waiting for existing sync...",
    );
    return syncPromise;
  }

  isSyncing = true;
  syncPromise = performSync(options);

  try {
    return await syncPromise;
  } finally {
    isSyncing = false;
    syncPromise = null;
  }
}

/**
 * Internal sync implementation
 */
async function performSync(options: SyncOptions = {}): Promise<SyncResult> {
  try {
    // Get current session - try cached first, then refresh if token is expired or missing
    let { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      return {
        success: false,
        error: `Session error: ${sessionError.message}`,
        timestamp: Date.now(),
      };
    }

    if (!session) {
      return {
        success: false,
        error: "No active session",
        timestamp: Date.now(),
      };
    }

    // Refresh token if it has expired or is about to expire (within 60 seconds)
    const expiresAt = session.expires_at ?? 0;
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (expiresAt - nowSeconds < 60) {
      console.log("[SYNC] Access token expired or expiring soon, refreshing...");
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !refreshData.session) {
        return {
          success: false,
          error: `Token refresh failed: ${refreshError?.message ?? "No session after refresh"}`,
          timestamp: Date.now(),
        };
      }
      session = refreshData.session;
    }

    // Requests dropped before the server had their status column: push them again (once).
    await resendPendingJoinRequestsOnce(session.user.id).catch((error) =>
      console.warn("[SYNC] Join request repair failed:", error),
    );

    const syncTimestamp = Date.now();

    await synchronize({
      database,
      // Lets a device that gains a table through a schema migration (e.g.
      // notifications at v19) receive that table's existing rows on its next pull.
      migrationsEnabledAtVersion: 18,
      pullChanges: async ({ lastPulledAt, migration }) => {
        const url = `${SUPABASE_URL}/functions/v1/sync`;
        console.log(
          "[SYNC] pullChanges called with lastPulledAt:",
          lastPulledAt,
          "URL:",
          url,
        );

        // Note: We pass empty changes during pull to get remote data
        const body = {
          changes: {},
          lastPulledAt: lastPulledAt || 0,
          migration: migration ?? null,
        };

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: SUPABASE_ANON_KEY!,
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const error = await response.text();
          console.error(
            "[SYNC] Pull failed with status",
            response.status,
            ":",
            error,
          );
          throw new Error(`Sync pull failed (${response.status}): ${error}`);
        }

        const result = await response.json();

        // Debug: Log all table sync results
        const tableNames = Object.keys(result.changes || {});
        const summary: Record<string, { c: number; u: number; d: number }> = {};
        for (const table of tableNames) {
          const tc = result.changes[table];
          if (tc?.created?.length || tc?.updated?.length || tc?.deleted?.length) {
            summary[table] = {
              c: tc.created?.length || 0,
              u: tc.updated?.length || 0,
              d: tc.deleted?.length || 0,
            };
          }
        }
        console.log("[SYNC] Pull response tables with data:", JSON.stringify(summary));
        console.log("[SYNC] All tables in response:", tableNames.join(", "));

        // Filter out organizations if skipOrganizations option is set
        // This is used during resetAndSync when organizations are preserved locally
        let changes = result.changes;
        if (options.skipOrganizations && changes?.organizations) {
          console.log("[SYNC] Skipping organizations (preserved locally)");
          delete changes.organizations;
        }

        return {
          changes,
          timestamp: result.timestamp,
        };
      },

      pushChanges: async ({ changes, lastPulledAt }) => {
        const url = `${SUPABASE_URL}/functions/v1/sync`;

        // Log what we're pushing
        const changesAny = changes as any;
        console.log(
          "[SYNC] pushChanges called with changes:",
          JSON.stringify({
            school_members: changesAny.school_members?.created?.length || 0,
            orders: changesAny.orders?.created?.length || 0,
            payment_records: changesAny.payment_records?.created?.length || 0,
            attendance_records: changesAny.attendance_records?.created?.length || 0,
            taggables_created: changesAny.taggables?.created?.length || 0,
            taggables_updated: changesAny.taggables?.updated?.length || 0,
            taggables_deleted: changesAny.taggables?.deleted?.length || 0,
            taggables_deleted_ids: changesAny.taggables?.deleted || [],
          }),
        );

        const body = {
          changes,
          lastPulledAt: lastPulledAt || 0,
        };

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: SUPABASE_ANON_KEY!,
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const error = await response.text();
          console.error("[SYNC] Push failed:", error);
          throw new Error(`Sync push failed: ${error}`);
        }

        await response.json();

        // pushChanges should not return anything (void)
        // Pull happens separately in pullChanges
      },

      // Conflict resolution: last write wins (based on updated_at timestamp)
      // WatermelonDB handles this automatically by comparing timestamps
    });

    return {
      success: true,
      timestamp: syncTimestamp,
    };
  } catch (error) {
    // Log full error for debugging
    console.error("[SYNC] Sync error:", error);

    // Extract error message from various error types
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    } else if (error && typeof error === "object") {
      errorMessage = JSON.stringify(error);
    }

    return {
      success: false,
      error: errorMessage,
      timestamp: Date.now(),
    };
  }
}

/**
 * Check if sync is currently in progress
 */
export function isSyncInProgress(): boolean {
  return isSyncing;
}

/**
 * Check if sync is needed based on last sync time
 *
 * @param lastSyncTime - Last successful sync timestamp
 * @param intervalMinutes - Minimum interval between syncs (default: 5 minutes)
 * @returns boolean - True if sync should be performed
 */
export function shouldSync(
  lastSyncTime: number | null,
  intervalMinutes: number = 5,
): boolean {
  if (!lastSyncTime) return true;

  const now = Date.now();
  const elapsed = now - lastSyncTime;
  const intervalMs = intervalMinutes * 60 * 1000;

  return elapsed >= intervalMs;
}

/**
 * Performs a full resync by clearing all local data first, then pulling fresh from server.
 * Use this when local data is corrupted or duplicates have appeared.
 *
 * WARNING: This will delete ALL local data. Any unsynced changes will be lost.
 *
 * @returns Promise<SyncResult> - Result of sync operation
 */
export async function fullResync(): Promise<SyncResult> {
  console.log("[SYNC] Starting full resync - clearing local database...");

  try {
    // Step 1: Clear all local data
    await resetLocalDatabase();
    console.log("[SYNC] Local database cleared, pulling fresh data...");

    // Step 2: Perform sync to pull fresh data from server
    // Since lastPulledAt is now 0, all records will be pulled as "created"
    return await sync();
  } catch (error) {
    console.error("[SYNC] Full resync error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: `Full resync failed: ${errorMessage}`,
      timestamp: Date.now(),
    };
  }
}
