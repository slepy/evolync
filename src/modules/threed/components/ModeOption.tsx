import { neutral } from "@/core/theme/tokens";
import type { LucideIcon } from "lucide-react-native";
import { Text, XStack } from "tamagui";
import { resolveListAccent } from "@/core/components";

const lime = resolveListAccent("threed");

export interface ModeOptionProps {
  icon: LucideIcon;
  label: string;
  on: boolean;
  disabled?: boolean;
  onPress: () => void;
}

export function ModeOption({
  icon: Icon,
  label,
  on,
  disabled,
  onPress,
}: ModeOptionProps) {
  const color = on ? lime.tint : neutral.muted;
  return (
    <XStack
      role="radio"
      aria-checked={on}
      aria-disabled={disabled}
      aria-label={label}
      onPress={disabled ? undefined : onPress}
      pressStyle={disabled ? undefined : { opacity: 0.85 }}
      opacity={disabled ? 0.45 : 1}
      flex={1}
      height={40}
      borderRadius={18}
      backgroundColor={on ? lime.fill : "transparent"}
      alignItems="center"
      justifyContent="center"
      gap={6}
    >
      <Icon size={16} color={color} strokeWidth={2.2} />
      <Text fontSize={14} fontWeight="$button" color={color}>
        {label}
      </Text>
    </XStack>
  );
}
