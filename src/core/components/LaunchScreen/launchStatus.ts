export type LaunchStatus = "syncing" | "offline" | "updating";

/**
 * "updating" while a newer app bundle downloads on launch, L3 when the device
 * has no connection (data opens from the device), L2 otherwise.
 */
export function resolveLaunchStatus(state: { isOnline: boolean; updating?: boolean }): LaunchStatus {
  if (state.updating) return "updating";
  return state.isOnline ? "syncing" : "offline";
}
