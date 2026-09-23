import { useStore } from "@/store";
import { RefreshCw } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Alert, Pressable } from "react-native";
import { Text, useTheme, XStack } from "tamagui";
import { SYNC_STATUS_CONFIG, SyncStatus } from "../constants/syncStatus";
import { useRouter } from "expo-router";

// ============================================================================
// SyncStatusBar Component
// ============================================================================

/**
 * Sync status indicator bar for Header component.
 * Shows connection state and last sync time.
 *
 * This component automatically detects network status and displays:
 * - Online/Offline status
 * - Syncing state (when applicable)
 * - Last sync time
 *
 * This is element #4 in the Header structure.
 */
export const SyncStatusBar: React.FC = () => {
  const theme = useTheme();
  const router = useRouter();
  const { sync, performSync, resetAndSync } = useStore();
  const [, setRefreshCounter] = useState(0);

  const status: SyncStatus = sync.isSyncing
    ? SyncStatus.SYNCING
    : sync.isOnline
      ? SyncStatus.ONLINE
      : SyncStatus.OFFLINE;

  const statusConfig = SYNC_STATUS_CONFIG[status];
  const StatusIcon = statusConfig.icon;

  const lastSyncTime: Date | undefined = sync.lastSyncTime
    ? new Date(sync.lastSyncTime)
    : undefined;

  // Refresh time display every second when online
  useEffect(() => {
    if (status !== SyncStatus.ONLINE || !lastSyncTime) return;

    const interval = setInterval(() => {
      setRefreshCounter((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [status, lastSyncTime]);

  // ==========================================================================
  // Helper Functions
  // ==========================================================================

  const formatLastSyncTime = () => {
    if (!lastSyncTime) return "";

    const now = new Date();
    const diffMs = now.getTime() - lastSyncTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return t("syncJustNow");
    if (diffMins < 60)
      return t("syncMinutesAgo", { minutes: diffMins });

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return t("syncHoursAgo", { hours: diffHours });

    return lastSyncTime.toLocaleDateString();
  };

  // ==========================================================================
  // Render
  // ==========================================================================

  const handlePress = () => {
    if (status === SyncStatus.SYNCING) return;

    performSync(true).catch((err: unknown) => {
      console.error("[SyncStatusBar] performSync failed:", err);
    });
  };

  const handleLongPress = () => {
    if (status === SyncStatus.SYNCING) return;

    // Get current user from store to check if authenticated
    const currentState = useStore.getState();
    console.log(`[SyncStatusBar] Long press - user: ${currentState.user?.id || 'NONE'}, session: ${!!currentState.session}`);

    if (!currentState.user?.id) {
      Alert.alert(
        t("syncResetTitle"),
        "You must be logged in to reset and sync",
        [{ text: "OK" }]
      );
      return;
    }

    Alert.alert(t("syncResetTitle"), t("syncResetMessage"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("reset"),
        style: "destructive",
        onPress: async () => {
          try {
            // First navigate to appropriate dashboard
            // Check if user has organization (instructor) or not (student)
            const state = useStore.getState();
            if (state.organization) {
              router.replace("/");
            } else {
              router.replace("/user/dashboard");
            }
            // Then start reset & sync (user will see sync indicator on dashboard)
            await resetAndSync();
          } catch (err: unknown) {
            console.error("[SyncStatusBar] resetAndSync failed:", err);
          }
        },
      },
    ]);
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={800}
      disabled={status === SyncStatus.SYNCING}
    >
      <XStack
        backgroundColor="$background"
        paddingHorizontal="$4"
        paddingVertical="$2"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
        gap="$2"
        alignItems="center"
        justifyContent="center"
      >
        <StatusIcon
          size={18}
          color={theme[statusConfig.color.slice(1) as keyof typeof theme]?.val}
        />
        <Text fontSize="$2" color={statusConfig.color} fontWeight="500">
          {t(statusConfig.label)}
        </Text>
        {lastSyncTime && status === SyncStatus.ONLINE && (
          <Text fontSize="$1" color="$softGrayDark">
            • {formatLastSyncTime()}
          </Text>
        )}
        {status !== SyncStatus.SYNCING && (
          <RefreshCw size={14} color={theme.softGrayDark?.val} />
        )}
      </XStack>
    </Pressable>
  );
};
