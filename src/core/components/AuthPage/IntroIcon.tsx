import type { LucideIcon } from "lucide-react-native";
import { View } from "tamagui";
import { resolveListAccent, type ListAccent } from "../List/accent";

export interface IntroIconProps {
  icon: LucideIcon;
  accent?: ListAccent;
}

/** 56px icon square of an `AuthIntro`, 26px icon in the accent tint on its 16% fill. */
export function IntroIcon({ icon: Icon, accent = "neutral" }: IntroIconProps) {
  const a = resolveListAccent(accent);
  return (
    <View width={56} height={56} borderRadius={18} backgroundColor={a.fill} alignItems="center" justifyContent="center">
      <Icon size={26} color={a.tint} strokeWidth={2} />
    </View>
  );
}
