import { resolveListAccent } from "@/core/components";
import { neutral, threedScene } from "@/core/theme/tokens";
import { LinearGradient } from "expo-linear-gradient";
import type { LucideIcon } from "lucide-react-native";
import { View } from "tamagui";

const lime = resolveListAccent("threed");

export interface RoundButtonProps {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  /**
   * "lime": 3D gradient (View, Next step). "card": card fill, raised border
   * (Previous step). "control": translucent raised fill over the scene (camera pad).
   */
  variant?: "lime" | "card" | "control";
  /** Default 52. */
  size?: 52 | 44;
  disabled?: boolean;
  /** Play icon drawn filled (View). */
  filled?: boolean;
}

/** Round icon button over or next to the 3D scene (D6 View, D8 camera pad, D9 previous / next). */
export function RoundButton({ icon: Icon, label, onPress, variant = "card", size = 52, disabled, filled }: RoundButtonProps) {
  const gradient = variant === "lime";
  const color = gradient ? lime.onGradient : neutral.text;
  const glyph = <Icon size={size === 52 ? 22 : 20} color={color} fill={filled ? color : "none"} strokeWidth={2.2} />;
  return (
    <View
      role="button"
      aria-label={label}
      aria-disabled={disabled}
      onPress={disabled ? undefined : onPress}
      pressStyle={disabled ? undefined : { opacity: 0.85 }}
      opacity={disabled ? 0.4 : 1}
      width={size}
      height={size}
      borderRadius={size / 2}
      overflow="hidden"
      flexShrink={0}
      borderWidth={gradient ? 0 : 1}
      borderColor="$neutralRaisedBorder"
      backgroundColor={gradient ? undefined : variant === "control" ? threedScene.control : "$neutralCard"}
      alignItems="center"
      justifyContent="center"
    >
      {gradient ? (
        <LinearGradient
          colors={[lime.from, lime.to]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}
        >
          {glyph}
        </LinearGradient>
      ) : (
        glyph
      )}
    </View>
  );
}
