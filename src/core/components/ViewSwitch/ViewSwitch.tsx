import type { LucideIcon } from "lucide-react-native";
import { Text, XStack } from "tamagui";
import { neutral } from "@/core/theme/tokens";
import { resolveListAccent, type ListAccent } from "../List/accent";

export interface ViewSwitchItem {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
}

export interface ViewSwitchProps {
  /** Module accent of the active tab. */
  accent: ListAccent;
  first: ViewSwitchItem;
  second: ViewSwitchItem;
  active: "first" | "second";
  "aria-label"?: string;
}

/**
 * Two views of one screen (board S section 8, 12A Orders / Shopping list):
 * card track, two 40px tabs with icon + label, the active one tinted in the
 * accent. Each tab runs its own action.
 */
export function ViewSwitch({ accent, first, second, active, ...aria }: ViewSwitchProps) {
  const a = resolveListAccent(accent);
  const tabs = [
    { key: "first" as const, item: first },
    { key: "second" as const, item: second },
  ];

  return (
    <XStack
      role="tablist"
      aria-label={aria["aria-label"]}
      gap={4}
      padding={4}
      borderRadius={24}
      borderWidth={1}
      borderColor="$neutralCardBorder"
      backgroundColor="$neutralCard"
    >
      {tabs.map(({ key, item: { icon: Icon, label, onPress } }) => {
        const on = key === active;
        return (
          <XStack
            key={key}
            role="tab"
            aria-selected={on}
            onPress={onPress}
            pressStyle={{ opacity: 0.85 }}
            flex={1}
            height={40}
            borderRadius={20}
            alignItems="center"
            justifyContent="center"
            gap={8}
            backgroundColor={on ? a.fill : "transparent"}
          >
            <Icon size={16} color={on ? a.tint : neutral.muted} strokeWidth={2.2} />
            <Text fontSize={14} fontWeight="$button" color={on ? a.tint : "$neutralMuted"} numberOfLines={1}>
              {label}
            </Text>
          </XStack>
        );
      })}
    </XStack>
  );
}
