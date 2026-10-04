import { neutral } from "@/core/theme/tokens";
import { getContrastColor } from "@/modules/core/utils/colorHelper";
import { Award } from "lucide-react-native";
import React from "react";
import { View } from "tamagui";

interface RankIconProps {
  /** Belt color; ranks keep it (data, not the Grading accent). */
  color?: string | null;
  size?: 48 | 36;
}

/** Rank icon square filled with the belt color. */
export const RankIcon: React.FC<RankIconProps> = ({ color, size = 48 }) => (
  <View
    width={size}
    height={size}
    borderRadius={size === 48 ? "$rowIcon" : 12}
    backgroundColor={color || "$neutralTintFill"}
    borderWidth={1}
    borderColor="$neutralRaisedBorder"
    alignItems="center"
    justifyContent="center"
    flexShrink={0}
  >
    <Award size={size === 48 ? 22 : 18} color={color ? getContrastColor(color) : neutral.tint} strokeWidth={2} />
  </View>
);
