import { contextColors, neutral, type ContextKey } from "@/core/theme/tokens";
import { ChevronsUpDown } from "lucide-react-native";
import { Text, XStack, YStack } from "tamagui";
import { type SwitcherContext, KICKER_KEYS } from "./contextMeta";
import { ContextBadge } from "./ContextBadge";

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
