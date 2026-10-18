import { resolveListAccent } from "@/core/components";
import { neutral } from "@/core/theme/tokens";
import type { LucideIcon } from "lucide-react-native";
import { Text, XStack } from "tamagui";

const lime = resolveListAccent("threed");

export interface ToolButtonProps {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  /** On state (D8 Partner shown): lime fill and text. */
  active?: boolean;
  disabled?: boolean;
}

/** 44px raised pill with an icon in the editor's tool row (Partner, Positions, Mirror, Save technique…). */
export function ToolButton({ icon: Icon, label, onPress, active, disabled }: ToolButtonProps) {
  const color = active ? lime.tint : neutral.text;
  return (
    <XStack
      role="button"
      aria-label={label}
      aria-pressed={active}
      aria-disabled={disabled}
      onPress={disabled ? undefined : onPress}
      pressStyle={disabled ? undefined : { opacity: 0.85 }}
      opacity={disabled ? 0.45 : 1}
      height={44}
      paddingHorizontal={14}
      borderRadius={22}
      borderWidth={1}
      borderColor={active ? "transparent" : "$neutralRaisedBorder"}
      backgroundColor={active ? lime.fill : "$neutralRaised"}
      alignItems="center"
      justifyContent="center"
      gap={7}
    >
      <Icon size={17} color={color} strokeWidth={2.2} />
      <Text fontSize={14} fontWeight="$button" color={color} numberOfLines={1}>
        {label}
      </Text>
    </XStack>
  );
}
