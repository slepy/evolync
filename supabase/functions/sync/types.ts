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
}

export interface SyncContext {
  supabaseClient: any;
  userId: string;
  changes: Record<string, { created: any[]; updated: any[]; deleted: string[] }>;
  lastPulledAt: number;
}
