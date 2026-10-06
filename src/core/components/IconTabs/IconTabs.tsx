import { neutral } from "@/core/theme/tokens";
import type { LucideIcon } from "lucide-react-native";
import { Text, XStack, YStack } from "tamagui";
import { resolveListAccent, type ListAccent } from "../List/accent";

export interface IconTab<K extends string> {
  key: K;
  icon: LucideIcon;
  label: string;
  /** Each tab is tinted in its own module color while active (16E: Payments green, Attendance blue…). */
  accent: ListAccent;
}

export interface IconTabsProps<K extends string> {
  tabs: IconTab<K>[];
  active: K;
  onChange: (key: K) => void;
  "aria-label"?: string;
}

/**
 * Three or more views of one screen (16E History tabs): card track, 56px
 * tabs with the icon above a small label, the active one in its accent.
 * Two views use `ViewSwitch`.
 */
export function IconTabs<K extends string>({ tabs, active, onChange, ...aria }: IconTabsProps<K>) {
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
      {tabs.map(({ key, icon: Icon, label, accent }) => {
        const on = key === active;
        const a = resolveListAccent(accent);
        return (
          <YStack
            key={key}
            role="tab"
            aria-selected={on}
            aria-label={label}
            onPress={() => onChange(key)}
            pressStyle={{ opacity: 0.85 }}
            flex={1}
            minWidth={0}
            height={56}
            borderRadius={20}
            alignItems="center"
            justifyContent="center"
            gap={3}
            backgroundColor={on ? a.fill : "transparent"}
          >
            <Icon size={18} color={on ? a.tint : neutral.muted} strokeWidth={2.2} />
            <Text fontSize={11.5} fontWeight="$button" color={on ? a.tint : "$neutralMuted"} numberOfLines={1}>
              {label}
            </Text>
          </YStack>
        );
      })}
    </XStack>
  );
}
