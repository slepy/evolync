import { contextColors, neutral, type ContextKey } from "@/core/theme/tokens";
import { LinearGradient } from "expo-linear-gradient";
import type { LucideIcon } from "lucide-react-native";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, View, XStack, YStack } from "tamagui";

export interface BottomNavItem {
  key: string;
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  /** Red dot on the icon (unread alerts). */
  dot?: boolean;
}

export interface BottomNavProps {
  /** Colors the active pill: Organization amber, School red, Student blue. */
  context: ContextKey;
  items: BottomNavItem[];
  /** Key of the active item; null when the screen is outside the nav. */
  activeKey: string | null;
}

const BAR_HEIGHT = 68;
const BAR_GAP = 20;

/** Bottom offset of the bar: 20px, or the home-indicator inset when larger. */
const barBottom = (insetBottom: number) => Math.max(insetBottom, BAR_GAP);

/**
 * Space to keep free under scroll content so the floating nav never covers
 * the last row (the ~110px the boards leave at the bottom).
 */
export function useBottomNavSpace(): number {
  const insets = useSafeAreaInsets();
  return barBottom(insets.bottom) + BAR_HEIGHT + 22;
}

/**
 * Floating bottom nav (board S, shared pieces): raised bar, inactive items as
 * icon + label, the active one as a pill in the context gradient. Render it
 * as the last child of a full-screen container; it positions itself.
 */
export function BottomNav({ context, items, activeKey }: BottomNavProps) {
  const insets = useSafeAreaInsets();

  return (
    <XStack
      role="tablist"
      position="absolute"
      left={16}
      right={16}
      bottom={barBottom(insets.bottom)}
      height={BAR_HEIGHT}
      paddingHorizontal={8}
      alignItems="center"
      justifyContent="space-around"
      borderRadius={34}
      borderWidth={1}
      borderColor="$neutralRaisedBorder"
      backgroundColor="$neutralRaised"
      shadowColor="$neutralShadow"
      shadowOffset={{ width: 0, height: 12 }}
      shadowOpacity={1}
      shadowRadius={16}
      elevation={12}
    >
      {items.map((item) =>
        item.key === activeKey ? (
          <ActivePill key={item.key} item={item} context={context} />
        ) : (
          <InactiveItem key={item.key} item={item} />
        ),
      )}
    </XStack>
  );
}

function ActivePill({ item, context }: { item: BottomNavItem; context: ContextKey }) {
  const c = contextColors[context];
  const Icon = item.icon;

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
        colors={[c.gradient[0].color, c.gradient[c.gradient.length - 1].color]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Icon size={20} color={c.fg} strokeWidth={2.2} />
      <Text fontSize={13} fontWeight="$button" color={c.fg} numberOfLines={1}>
        {item.label}
      </Text>
    </XStack>
  );
}

function InactiveItem({ item }: { item: BottomNavItem }) {
  const Icon = item.icon;

  return (
    <YStack
      role="tab"
      aria-selected={false}
      aria-label={item.label}
      onPress={item.onPress}
      pressStyle={{ opacity: 0.7 }}
      width={56}
      height={56}
      gap={4}
      alignItems="center"
      justifyContent="center"
    >
      <View>
        <Icon size={22} color={neutral.muted} strokeWidth={2.2} />
        {item.dot ? (
          <View
            position="absolute"
            top={-3}
            right={-4}
            width={11}
            height={11}
            borderRadius={6}
            borderWidth={2}
            borderColor="$neutralRaised"
            backgroundColor="$alertDot"
          />
        ) : null}
      </View>
      <Text fontSize={11} fontWeight="700" color="$neutralMuted" numberOfLines={1}>
        {item.label}
      </Text>
    </YStack>
  );
}
