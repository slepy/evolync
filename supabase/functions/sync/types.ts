/**
 * Shared types for sync functions
 */

export interface SyncPullChanges {
  changes: Record<
    string,
    { created: any[]; updated: any[]; deleted: string[] }
  >;
  timestamp: number;
}

export interface SyncPushChanges {
  changes: Record<
    string,
    { created: any[]; updated: any[]; deleted: string[] }
  >;
  lastPulledAt: number;
  /** Sent by WatermelonDB when the client schema migrated since the last pull. */
  migration?: { from: number; tables: string[]; columns: { table: string; columns: string[] }[] } | null;
}

export interface SyncContext {
  supabaseClient: any;
  userId: string;
  changes: Record<string, { created: any[]; updated: any[]; deleted: string[] }>;
  lastPulledAt: number;
  /** Tables the client just gained through a schema migration; pulled as a first sync. */
  migratedTables?: string[];
  /** Tables that gained columns in that migration; their rows are pulled in full. */
  columnMigratedTables?: string[];
}
