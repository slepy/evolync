export type SyncPillStatus = "synced" | "syncing" | "offline" | "error";

export interface SyncPillSource {
  isSyncing: boolean;
  isOnline: boolean;
  lastSyncError: string | null;
}

/** Offline wins (nothing can sync), then a sync in progress, then the last result. */
export function resolveSyncPillStatus(sync: SyncPillSource): SyncPillStatus {
  if (!sync.isOnline) return "offline";
  if (sync.isSyncing) return "syncing";
  if (sync.lastSyncError) return "error";
  return "synced";
}
