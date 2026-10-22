import { neutral } from "@/core/theme/tokens";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { XStack } from "tamagui";

export interface ExpandButtonProps {
  expanded: boolean;
  /** Accessible label of the action, e.g. "Show participants" / "Hide participants". */
  label: string;
  onPress: () => void;
}

/**
 * 44px chevron on the right of a pressable `ListRow`: a tap expands or
 * collapses the row's content (turned up while expanded) without the row's
 * own `onPress`.
 */
export function ExpandButton({ expanded, label, onPress }: ExpandButtonProps) {
  const Chevron = expanded ? ChevronUp : ChevronDown;
  return (
    <XStack
      role="button"
      aria-label={label}
      aria-expanded={expanded}
      onPress={(event) => {
        // The row around it opens the details; on web the click would bubble.
        event?.stopPropagation?.();
        onPress();
      }}
      pressStyle={{ opacity: 0.7 }}
      width={44}
      height={44}
      marginRight={-10}
      alignItems="center"
      justifyContent="center"
      flexShrink={0}
    >
      {/* An icon, not a rotated one: react-native-svg rotates around its top-left corner and the chevron leaves the view. */}
      <Chevron size={20} color={neutral.muted} strokeWidth={2.2} />
    </XStack>
  );
}
