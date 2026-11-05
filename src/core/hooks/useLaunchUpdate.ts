import NetInfo from "@react-native-community/netinfo";
import * as Updates from "expo-updates";
import { useEffect, useState } from "react";
import { runLaunchUpdate, type LaunchUpdatePhase } from "./launchUpdate";

/**
 * Cold-start update (EAS Update): checks the build's channel once per launch
 * and reloads onto a newer bundle before sync and navigation start. Returns
 * the phase; render the app only once it is `done`.
 */
export function useLaunchUpdate(): LaunchUpdatePhase {
  const [phase, setPhase] = useState<LaunchUpdatePhase>(Updates.isEnabled ? "checking" : "done");

  useEffect(() => {
    runLaunchUpdate({
      isEnabled: Updates.isEnabled,
      // Reachability can still be unknown right after launch; the check's
      // timeout covers a connection that turns out to be dead.
      isOnline: async () => {
        const state = await NetInfo.fetch();
        return state.isConnected === true && state.isInternetReachable !== false;
      },
      checkForUpdate: () => Updates.checkForUpdateAsync(),
      fetchUpdate: () => Updates.fetchUpdateAsync(),
      reload: () => Updates.reloadAsync(),
      onPhase: setPhase,
      onError: (error) => console.warn("[launch update]", error),
    });
  }, []);

  return phase;
}
