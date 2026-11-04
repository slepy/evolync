import { useStore } from "@/store";
import { showSyncErrorReport } from "@/core/utils/diagnostics";
import { resolveSyncPillStatus } from "./syncPillStatus";
import { SyncedPillView } from "./SyncedPillView";

/**
 * `SyncedPillView` fed from the app's sync state; tap forces a sync. After a
 * failed sync a tap first shows why (shareable, with Retry).
 */
export function SyncedPill() {
  const sync = useStore((s) => s.sync);
  const performSync = useStore((s) => s.performSync);
  const status = resolveSyncPillStatus(sync);
  const retry = () => performSync(true).catch(console.error);

  return (
    <SyncedPillView
      status={status}
      onPress={() =>
        status === "error" && sync.lastSyncError
          ? showSyncErrorReport(sync.lastSyncError, retry)
          : retry()
      }
    />
  );
}
