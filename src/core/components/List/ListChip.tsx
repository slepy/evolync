import type { LucideIcon } from "lucide-react-native";
import { Text, XStack } from "tamagui";
import { resolveListAccent, type ListAccent } from "./accent";

export interface ListChipProps {
  label: string;
  accent?: ListAccent;
  /** 14px icon in front of the label (10C "Exams planned"). */
  icon?: LucideIcon;
}

/** Count / status chip ("3 selected", "8/12", "86%", "Pending"). */
export function ListChip({ label, accent = "neutral", icon: Icon }: ListChipProps) {
  const a = resolveListAccent(accent);
  return (
    <XStack
      alignItems="center"
      gap={5}
      paddingVertical={3}
      paddingHorizontal={9}
      borderRadius={9}
      backgroundColor={a.fill}
      flexShrink={0}
    >
      {Icon ? <Icon size={14} color={a.label} strokeWidth={2.2} /> : null}
      <Text fontSize={12.5} fontWeight="$button" color={a.label} numberOfLines={1}>
        {label}
      </Text>
    </XStack>
  );
}
