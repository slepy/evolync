import { Loader2, Wifi, WifiOff, type LucideIcon } from "lucide-react-native";
import type { ColorTokens } from "tamagui";

export enum SyncStatus {
  SYNCING = "syncing",
  ONLINE = "online",
  OFFLINE = "offline",
}

export const SYNC_STATUS_CONFIG: Record<
  SyncStatus,
  {
    icon: LucideIcon;
    color: ColorTokens;
    label: string;
  }
> = {
  [SyncStatus.SYNCING]: {
    icon: Loader2,
    color: "$blue11",
    label: "syncSyncing",
  },
  [SyncStatus.ONLINE]: {
    icon: Wifi,
    color: "$green10",
    label: "syncOnline",
  },
  [SyncStatus.OFFLINE]: {
    icon: WifiOff,
    color: "$textSecondary",
    label: "syncOffline",
  },
};
