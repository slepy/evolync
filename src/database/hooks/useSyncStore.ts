import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { useEffect } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useStore } from "@/store";

const LAST_SYNC_KEY = "@evolync:lastSync";

/**
 * Hook to initialize global sync state management
 *
 * This hook should be called once in the app root (e.g., in _layout.tsx)
 * to set up listeners for network status and app state changes.
 *
 * Usage:
 * ```
 * // In app root (_layout.tsx or similar)
 * useSyncStore({ autoSyncOnline: true, autoSyncOnForeground: true })
 * ```
 */
export function useSyncStore(options?: {
  autoSyncOnline?: boolean;
  autoSyncOnForeground?: boolean;
}) {
  const { autoSyncOnline = true, autoSyncOnForeground = true } = options || {};
  const { setSyncState, performSync } = useStore();

  // Load last sync time from storage on mount
  useEffect(() => {
    AsyncStorage.getItem(LAST_SYNC_KEY)
      .then((value) => {
        if (value) {
          const timestamp = parseInt(value, 10);
          setSyncState({ lastSyncTime: timestamp });
        }
      })
      .catch((error) => {
        console.error("[useSyncStore] Failed to load last sync time:", error);
      });
  }, [setSyncState]);

  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isOnline =
        state.isConnected === true && state.isInternetReachable === true;

      setSyncState({ isOnline });

      // If coming online and auto-sync is enabled
      if (isOnline && autoSyncOnline) {
        performSync(false);
      }
    });

    return () => unsubscribe();
  }, [autoSyncOnline, setSyncState, performSync]);

  // Monitor app state (foreground/background)
  useEffect(() => {
    if (!autoSyncOnForeground) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        performSync(false);
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };
  }, [autoSyncOnForeground, performSync]);

  // Periodic sync check (interval)
  useEffect(() => {
    if (!autoSyncOnline) return;

    // Check every minute if it's time to sync
    // performSync internally checks if 5 minutes have passed since last sync
    const interval = setInterval(() => {
      performSync(false);
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [autoSyncOnline, performSync]);
}
