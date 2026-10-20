import { useStore } from "@/store";
import { resolveSyncPillStatus } from "./syncPillStatus";
import { SyncedPillView } from "./SyncedPillView";

/** `SyncedPillView` fed from the app's sync state; tap forces a sync. */
export function SyncedPill() {
  const sync = useStore((s) => s.sync);
  const performSync = useStore((s) => s.performSync);

  return (
    <SyncedPillView
      status={resolveSyncPillStatus(sync)}
      onPress={() => performSync(true).catch(console.error)}
    />
  );
}
