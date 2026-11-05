import { useStore } from "@/store";
import { resolveLaunchStatus } from "./launchStatus";
import { LaunchScreenView } from "./LaunchScreenView";

export interface LaunchScreenProps {
  /** A newer app bundle is downloading (cold-start update). */
  updating?: boolean;
}

/** `LaunchScreenView` following the device connection. */
export function LaunchScreen({ updating = false }: LaunchScreenProps) {
  const isOnline = useStore((s) => s.sync.isOnline);
  return <LaunchScreenView status={resolveLaunchStatus({ isOnline, updating })} />;
}
