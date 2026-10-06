import type { LucideIcon } from "lucide-react-native";
import { XStack } from "tamagui";
import { resolveStatusColor, type StatusColor } from "../StatusBadge/statusColor";

export interface StatusButtonProps {
  /** Icon of the current status (Present check, Pending clock…). */
  icon: LucideIcon;
  /** Status color: a `ListAccent` or explicit `{ tint, fill }`. */
  color: StatusColor;
  /** Accessible label, e.g. "Change status, now Paid". */
  label: string;
  /** A tap moves the row to its next status. */
  onPress: () => void;
  disabled?: boolean;
}

/**
 * 44px round status button on the right of a member row (10D, 13B, 14B):
 * icon only, tinted by the status; a tap cycles to the next status.
 */
export function StatusButton({ icon: Icon, color, label, onPress, disabled }: StatusButtonProps) {
  const { tint, fill } = resolveStatusColor(color);
  return (
    <XStack
      role="button"
      aria-label={label}
      aria-disabled={disabled}
      onPress={
        disabled
          ? undefined
          : (event) => {
              // The row around it may be pressable too (14B opens Edit payment); on web the click would bubble.
              event?.stopPropagation?.();
              onPress();
            }
      }
      pressStyle={disabled ? undefined : { opacity: 0.8 }}
      width={44}
      height={44}
      borderRadius={22}
      backgroundColor={fill}
      alignItems="center"
      justifyContent="center"
      flexShrink={0}
    >
      <Icon size={18} color={tint} strokeWidth={2.6} />
    </XStack>
  );
}
