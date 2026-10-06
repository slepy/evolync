import { danger } from "@/core/theme/tokens";
import { Trash2 } from "lucide-react-native";
import { View } from "tamagui";

export interface TrashButtonProps {
  onPress: () => void;
  /** Accessible label (default: "Delete"). */
  label?: string;
  disabled?: boolean;
  /** 44 (default, screen header); 40 inside a card row (T4 row delete). */
  size?: 44 | 40;
}

/** Icon-only delete button (11D): 44px red circle, never neutral gray. */
export function TrashButton({ onPress, label, disabled, size = 44 }: TrashButtonProps) {
  return (
    <View
      role="button"
      aria-label={label ?? t("delete")}
      aria-disabled={disabled}
      onPress={disabled ? undefined : onPress}
      pressStyle={disabled ? undefined : { opacity: 0.8 }}
      opacity={disabled ? 0.5 : 1}
      width={size}
      height={size}
      borderRadius={size / 2}
      borderWidth={1}
      borderColor="$trashBorder"
      backgroundColor="$trashFill"
      alignItems="center"
      justifyContent="center"
      flexShrink={0}
    >
      <Trash2 size={size === 40 ? 17 : 19} color={danger.text} strokeWidth={2} />
    </View>
  );
}
