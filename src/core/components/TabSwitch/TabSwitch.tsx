import { neutral } from "@/core/theme/tokens";
import type { LucideIcon } from "lucide-react-native";
import { Text, XStack } from "tamagui";
import { resolveListAccent, type ListAccent } from "../List/accent";

export interface TabSwitchOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

export interface TabSwitchProps<T extends string> {
  options: TabSwitchOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accent?: ListAccent;
  "aria-label"?: string;
}

/**
 * Two or three views of one screen (12A Orders / Shopping list): a card-fill
 * track, 40px tabs with icon + label, the active one tinted in the accent.
 */
export function TabSwitch<T extends string>({ options, value, onChange, accent = "neutral", ...aria }: TabSwitchProps<T>) {
  const a = resolveListAccent(accent);

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
      {options.map(({ value: v, label, icon: Icon }) => {
        const active = v === value;
        const color = active ? a.tint : "$neutralMuted";
        return (
          <XStack
            key={v}
            role="tab"
            aria-selected={active}
            onPress={() => onChange(v)}
            pressStyle={{ opacity: 0.85 }}
            flex={1}
            height={40}
            borderRadius={20}
            alignItems="center"
            justifyContent="center"
            gap={8}
            backgroundColor={active ? a.fill : "transparent"}
          >
            {Icon ? <Icon size={16} color={active ? a.tint : neutral.muted} strokeWidth={2.2} /> : null}
            <Text fontSize={14} fontWeight="$button" color={color} numberOfLines={1}>
              {label}
            </Text>
          </XStack>
        );
      })}
    </XStack>
  );
}
