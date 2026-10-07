import { contextColors, neutral, type ContextKey, type PageContext } from "@/core/theme/tokens";
import { LinearGradient } from "expo-linear-gradient";
import { Building2, ChevronsUpDown, School, UserRound, type LucideIcon } from "lucide-react-native";
import { StyleSheet } from "react-native";
import { Text, View, XStack, YStack } from "tamagui";

export type SwitcherContext = PageContext;

/** Organization = building, School (instructor) = school, Student = person (3 / 4 / 5). */
export const CONTEXT_ICONS: Record<SwitcherContext, LucideIcon> = {
  organization: Building2,
  school: School,
  student: UserRound,
  neutral: UserRound,
};

const KICKER_KEYS: Record<ContextKey, string> = {
  organization: "contextOrganization",
  school: "contextSchool",
  student: "contextStudent",
};

/**
 * Rounded square in the context gradient with a white (organization: dark)
 * icon: the switcher badge and the rows of the context sheet. Neutral is a
 * flat slate square.
 */
export function ContextBadge({
  context,
  icon: Icon = CONTEXT_ICONS[context],
  size = 40,
}: {
  context: SwitcherContext;
  icon?: LucideIcon;
  size?: 40 | 48;
}) {
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

export interface ContextSwitcherProps {
  /** Organization (amber, 1A), School (red), Student (blue, 4), neutral (5). */
  context: SwitcherContext;
  /** Name of the current organization / school ("My dashboard" when neutral). */
  title: string;
  /** Opens the context sheet. Without it the switcher is a static label (one context only). */
  onPress?: () => void;
  /** Accessible label of the button (default: the title). */
  label?: string;
}

/**
 * Context switcher (top-left of a dashboard, next to the Synced pill, boards
 * 1A / 3 / 4 / 5): raised 52px pill with the context badge, the context
 * kicker ("STUDENT") over the current name and an up/down chevron. Neutral
 * shows the name alone.
 */
export function ContextSwitcher({ context, title, onPress, label }: ContextSwitcherProps) {
  const kicker = context === "neutral" ? null : t(KICKER_KEYS[context]);

  return (
    <XStack
      role={onPress ? "button" : undefined}
      aria-label={label ?? title}
      aria-haspopup={onPress ? "dialog" : undefined}
      onPress={onPress}
      pressStyle={onPress ? { opacity: 0.85 } : undefined}
      flexShrink={1}
      minWidth={0}
      alignItems="center"
      gap={10}
      height={52}
      paddingLeft={6}
      paddingRight={onPress ? 12 : 16}
      borderRadius={26}
      borderWidth={1}
      borderColor="$neutralRaisedBorder"
      backgroundColor="$neutralCard"
    >
      <ContextBadge context={context} />
      <YStack flexShrink={1} minWidth={0} gap={1}>
        {kicker ? (
          <Text
            fontSize={10.5}
            fontWeight="800"
            letterSpacing={0.9}
            textTransform="uppercase"
            color={contextColors[context as ContextKey].label}
            numberOfLines={1}
          >
            {kicker}
          </Text>
        ) : null}
        <Text fontSize={15} fontWeight="800" color="$neutralText" numberOfLines={1}>
          {title}
        </Text>
      </YStack>
      {onPress ? <ChevronsUpDown size={18} color={neutral.muted} strokeWidth={2} /> : null}
    </XStack>
  );
}
