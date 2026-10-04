import { contextColors, type ContextKey } from "@/core/theme/tokens";
import { LinearGradient } from "expo-linear-gradient";
import { Building2, ChevronDown, GraduationCap, School, type LucideIcon } from "lucide-react-native";
import { StyleSheet } from "react-native";
import { Text, View, XStack } from "tamagui";

/** Organization = building, School (instructor) = school, Student = graduation cap. */
export const CONTEXT_ICONS: Record<ContextKey, LucideIcon> = {
  organization: Building2,
  school: School,
  student: GraduationCap,
};

export interface ContextSwitcherProps {
  /** Organization (amber, 1A), School (red), Student (blue, 4). */
  context: ContextKey;
  /** Name of the current organization / school. */
  title: string;
  /** Opens the context sheet. Without it the switcher is a static label (one context only). */
  onPress?: () => void;
  /** Accessible label of the button (default: the title). */
  label?: string;
}

/**
 * Context switcher (top-left of a dashboard, next to the Synced pill): raised
 * pill with the context badge, the current name and a chevron in the context
 * color. Only the context changes between the organization, school and
 * student versions.
 */
export function ContextSwitcher({ context, title, onPress, label }: ContextSwitcherProps) {
  const c = contextColors[context];
  const Icon = CONTEXT_ICONS[context];

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
      gap={8}
      height={44}
      paddingLeft={6}
      paddingRight={onPress ? 10 : 14}
      borderRadius={22}
      borderWidth={1}
      borderColor="$neutralRaisedBorder"
      backgroundColor="$neutralRaised"
    >
      <View width={32} height={32} borderRadius={16} overflow="hidden" alignItems="center" justifyContent="center">
        <LinearGradient
          colors={[c.gradient[0].color, c.gradient[c.gradient.length - 1].color]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Icon size={16} color={c.fg} strokeWidth={2.2} />
      </View>
      <Text flexShrink={1} fontSize="$button" fontWeight="$button" color="$neutralText" numberOfLines={1}>
        {title}
      </Text>
      {onPress ? <ChevronDown size={18} color={c.label} strokeWidth={2.4} /> : null}
    </XStack>
  );
}
