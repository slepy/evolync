import { Plus } from "lucide-react-native";
import { Text, XStack } from "tamagui";
import { resolveListAccent, type ListAccent } from "./accent";
import type { ListSectionAction } from "./types";

export interface SectionActionPillProps {
  action: ListSectionAction;
  accent: ListAccent;
}

/** Pill button on the right of a `ListSection` header ("Add new"), or under a row (10D1 "Add order"). */
export function SectionActionPill({ action, accent }: SectionActionPillProps) {
  const a = resolveListAccent(accent);
  const Icon = action.icon ?? Plus;

  return (
    <XStack
      role="button"
      aria-label={action.ariaLabel ?? action.label}
      onPress={action.onPress}
      pressStyle={{ opacity: 0.8 }}
      alignItems="center"
      gap={6}
      height={40}
      paddingLeft={12}
      paddingRight={16}
      borderRadius="$pill"
      backgroundColor={a.fill}
    >
      <Icon size={16} color={a.label} strokeWidth={2.8} />
      <Text fontSize="$button" fontWeight="$button" color={a.label}>
        {action.label}
      </Text>
    </XStack>
  );
}
