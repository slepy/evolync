import { useStore } from "@/store";
import { resolveLaunchStatus } from "./launchStatus";
import { LaunchScreenView } from "./LaunchScreenView";

/** `LaunchScreenView` following the device connection. */
export function LaunchScreen() {
  const isOnline = useStore((s) => s.sync.isOnline);
  return <LaunchScreenView status={resolveLaunchStatus({ isOnline })} />;
}
