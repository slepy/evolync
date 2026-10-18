import { neutral } from "@/core/theme/tokens";
import { getContrastColor } from "@/core/utils/colorHelper";
import { Award } from "lucide-react-native";
import React from "react";
import { View } from "tamagui";

type RankIconSize = 48 | 44 | 40 | 36;

interface RankIconProps {
  /** Belt color; ranks keep it (data, not the Grading accent). */
  color?: string | null;
  size?: RankIconSize;
  /** "No rank" option / field (16E / 16F): dashed outline, muted icon. */
  empty?: boolean;
}

const RADIUS: Record<RankIconSize, number | "$rowIcon"> = { 48: "$rowIcon", 44: 14, 40: 14, 36: 12 };
const ICON: Record<RankIconSize, number> = { 48: 22, 44: 22, 40: 20, 36: 18 };

/** Rank icon square filled with the belt color. */
export const RankIcon: React.FC<RankIconProps> = ({ color, size = 48, empty }) => (
  <View
    width={size}
    height={size}
    borderRadius={RADIUS[size]}
    backgroundColor={empty ? "transparent" : color || "$neutralTintFill"}
    borderWidth={empty ? 1.5 : 1}
    borderStyle={empty ? "dashed" : "solid"}
    borderColor={empty ? "$neutralControl" : "$neutralRaisedBorder"}
    alignItems="center"
    justifyContent="center"
    flexShrink={0}
  >
    <Award
      size={ICON[size]}
      color={empty ? neutral.placeholder : color ? getContrastColor(color) : neutral.tint}
      strokeWidth={2}
    />
  </View>
);
