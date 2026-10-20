import { contextColors, neutral, type PageContext } from "@/core/theme/tokens";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";
import { Text, XStack } from "tamagui";
import type { BottomNavItem } from "./types";

export interface ActivePillProps {
  item: BottomNavItem;
  context: PageContext;
}

export function ActivePill({ item, context }: ActivePillProps) {
  const Icon = item.icon;
  const colors =
    context === "neutral"
      ? { from: neutral.text, to: neutral.text, fg: neutral.page }
      : {
          from: contextColors[context].gradient[0].color,
          to: contextColors[context].gradient[contextColors[context].gradient.length - 1].color,
          fg: contextColors[context].fg,
        };

  return (
    <XStack
      role="tab"
      aria-selected
      aria-label={item.label}
      onPress={item.onPress}
      pressStyle={{ opacity: 0.9 }}
      height={50}
      paddingHorizontal={18}
      gap={8}
      alignItems="center"
      borderRadius={25}
      overflow="hidden"
    >
      <LinearGradient
        colors={[colors.from, colors.to]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Icon size={20} color={colors.fg} strokeWidth={2.2} />
      <Text fontSize={13} fontWeight="$button" color={colors.fg} numberOfLines={1}>
        {item.label}
      </Text>
    </XStack>
  );
}
