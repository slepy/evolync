import { contextColors, neutral } from "@/core/theme/tokens";
import { LinearGradient } from "expo-linear-gradient";
import { type LucideIcon } from "lucide-react-native";
import { StyleSheet } from "react-native";
import { View } from "tamagui";
import { type SwitcherContext, CONTEXT_ICONS } from "./contextMeta";

export interface ContextBadgeProps {
  context: SwitcherContext;
  icon?: LucideIcon;
  size?: 40 | 48;
}

/**
 * Rounded square in the context gradient with a white (organization: dark)
 * icon: the switcher badge and the rows of the context sheet. Neutral is a
 * flat slate square.
 */
export function ContextBadge({
  context,
  icon: Icon = CONTEXT_ICONS[context],
  size = 40,
}: ContextBadgeProps) {
  const iconSize = size === 48 ? 22 : 20;

  if (context === "neutral") {
    return (
      <View
        width={size}
        height={size}
        borderRadius={size === 48 ? 16 : 14}
        backgroundColor={neutral.badge}
        alignItems="center"
        justifyContent="center"
        flexShrink={0}
      >
        <Icon size={iconSize} color={neutral.tint} strokeWidth={2.2} />
      </View>
    );
  }

  const c = contextColors[context];
  return (
    <View
      width={size}
      height={size}
      borderRadius={size === 48 ? 16 : 14}
      overflow="hidden"
      alignItems="center"
      justifyContent="center"
      flexShrink={0}
    >
      <LinearGradient
        colors={[c.gradient[0].color, c.gradient[c.gradient.length - 1].color]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Icon size={iconSize} color={c.fg} strokeWidth={2.2} />
    </View>
  );
}
