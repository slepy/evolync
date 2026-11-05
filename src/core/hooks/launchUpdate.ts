/** Phase of the launch update: checking the channel, downloading a newer bundle, or done. */
export type LaunchUpdatePhase = "checking" | "updating" | "done";

/** What the flow needs from expo-updates and the device, injected so it can be tested. */
export interface LaunchUpdateDeps {
  /** False in the dev client, Expo Go and on web: no update is ever checked. */
  isEnabled: boolean;
  isOnline: () => Promise<boolean>;
  checkForUpdate: () => Promise<{ isAvailable: boolean }>;
  fetchUpdate: () => Promise<{ isNew: boolean }>;
  reload: () => Promise<void>;
  onPhase: (phase: LaunchUpdatePhase) => void;
  onError?: (error: unknown) => void;
}

export interface LaunchUpdateTimeouts {
  checkMs: number;
  fetchMs: number;
}

/** A check that takes longer (captive network) opens the current bundle. */
export const LAUNCH_UPDATE_TIMEOUTS: LaunchUpdateTimeouts = { checkMs: 3000, fetchMs: 20000 };

class LaunchUpdateTimeout extends Error {
  constructor(step: string, ms: number) {
    super(`Launch update ${step} timed out after ${ms} ms`);
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, step: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new LaunchUpdateTimeout(step, ms)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * Cold-start update: when online, check the build's channel and, if a newer
 * bundle exists, download it and reload onto it. Any timeout or error ends in
 * `done` on the current bundle; a download finished late is applied by
 * expo-updates on the next launch.
 */
export async function runLaunchUpdate(
  deps: LaunchUpdateDeps,
  timeouts: LaunchUpdateTimeouts = LAUNCH_UPDATE_TIMEOUTS,
): Promise<void> {
  try {
    if (await applyNewerBundle(deps, timeouts)) return;
  } catch (error) {
    deps.onError?.(error);
  }
  deps.onPhase("done");
}

/**
 * True once the reload onto a newer bundle was requested: the app restarts, so
 * the launch screen stays and sync / navigation never start in the old bundle.
 */
async function applyNewerBundle(deps: LaunchUpdateDeps, timeouts: LaunchUpdateTimeouts): Promise<boolean> {
  if (!deps.isEnabled || !(await deps.isOnline())) return false;

  const check = await withTimeout(deps.checkForUpdate(), timeouts.checkMs, "check");
  if (!check.isAvailable) return false;

  deps.onPhase("updating");
  const fetched = await withTimeout(deps.fetchUpdate(), timeouts.fetchMs, "download");
  if (!fetched.isNew) return false;

  await deps.reload();
  return true;
}
