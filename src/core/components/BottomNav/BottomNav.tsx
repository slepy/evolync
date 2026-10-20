import { type PageContext } from "@/core/theme/tokens";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XStack } from "tamagui";
import type { BottomNavItem } from "./types";
import { ActivePill } from "./ActivePill";
import { InactiveItem } from "./InactiveItem";

export interface BottomNavProps {
  /** Colors the active pill: Organization amber, School red, Student blue, neutral white (5). */
  context: PageContext;
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
