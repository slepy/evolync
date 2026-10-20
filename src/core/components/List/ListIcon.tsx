import type { LucideIcon } from "lucide-react-native";
import { View } from "tamagui";
import { resolveListAccent, type ListAccent } from "./accent";

export interface ListIconProps {
  icon: LucideIcon;
  accent?: ListAccent;
  size?: 48 | 44 | 40 | 36 | 32;
}

/** Module-tinted icon square: 48px in "lg" rows, 44px in "md" rows, 32px in front of a toggle row (14B "Amounts"). */
export function ListIcon({ icon: Icon, accent = "neutral", size = 48 }: ListIconProps) {
  const a = resolveListAccent(accent);
  return (
    <View
      width={size}
      height={size}
      borderRadius={size === 48 ? "$rowIcon" : size === 44 || size === 40 ? 14 : size === 36 ? 12 : 10}
      backgroundColor={a.fill}
      alignItems="center"
      justifyContent="center"
      flexShrink={0}
    >
      <Icon size={size === 32 ? 16 : size === 36 ? 18 : size === 40 ? 20 : 22} color={a.tint} strokeWidth={2} />
    </View>
  );
}
