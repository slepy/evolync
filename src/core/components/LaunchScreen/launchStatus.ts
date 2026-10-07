export type LaunchStatus = "syncing" | "offline";

/** L3 when the device has no connection (data opens from the device), L2 otherwise. */
export function resolveLaunchStatus(sync: { isOnline: boolean }): LaunchStatus {
  return sync.isOnline ? "syncing" : "offline";
}
