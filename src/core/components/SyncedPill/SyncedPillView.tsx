import { danger, neutral } from "@/core/theme/tokens";
import { AlertTriangle, Check, CloudOff, RefreshCw, type LucideIcon } from "lucide-react-native";
import { Text, XStack } from "tamagui";
import type { SyncPillStatus } from "./syncPillStatus";

export interface SyncedPillViewProps {
  status: SyncPillStatus;
  /** Tap to sync now; ignored while syncing. */
  onPress?: () => void;
}

export const LABEL_KEY: Record<SyncPillStatus, string> = {
  synced: "syncSynced",
  syncing: "syncSynced",
  offline: "syncOffline",
  error: "syncFailed",
};

export const ICON: Record<SyncPillStatus, LucideIcon> = {
  synced: Check,
  syncing: RefreshCw,
  offline: CloudOff,
  error: AlertTriangle,
};

/**
 * Sync pill (1A, board S shared pieces): 30px, icon + 12/700 label. Green
 * check + "Sync" (same word in every language) when synced, muted while
 * syncing or offline, red after a failed sync.
 */
export function SyncedPillView({ status, onPress }: SyncedPillViewProps) {
  const label = t(LABEL_KEY[status]);
  const fg =
    status === "synced"
      ? "$synced"
      : status === "error"
        ? "$trashText"
        : "$neutralMuted";
  const iconColor =
    status === "synced"
      ? neutral.synced
      : status === "error"
        ? danger.text
        : neutral.muted;
  const Icon = ICON[status];
  const bg =
    status === "synced"
      ? "$syncedFill"
      : status === "error"
        ? "$trashFill"
        : "$neutralRaised";
  const pressable = onPress && status !== "syncing";

  return (
    <XStack
      role={pressable ? "button" : undefined}
      aria-label={label}
      onPress={pressable ? onPress : undefined}
      pressStyle={pressable ? { opacity: 0.8 } : undefined}
      hitSlop={7}
      flexShrink={0}
      alignItems="center"
      gap={5}
      height={30}
      paddingHorizontal={12}
      borderRadius={15}
      backgroundColor={bg}
    >
      <Icon
        size={14}
        color={iconColor}
        strokeWidth={status === "synced" ? 3 : 2.4}
      />
      <Text fontSize={12} fontWeight="700" color={fg} numberOfLines={1}>
        {label}
      </Text>
    </XStack>
  );
}
