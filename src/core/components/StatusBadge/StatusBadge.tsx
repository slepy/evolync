import { Text, View, XStack } from "tamagui";
import { resolveStatusColor, type StatusColor } from "./statusColor";

export interface StatusBadgeProps {
  label: string;
  color: StatusColor;
}

/**
 * Mini status badge on the right of a list row, under the amount (board S
 * section 10, 12A): dot + name in the status color on its tinted fill.
 * Read-only: the row is the link.
 */
export function StatusBadge({ label, color }: StatusBadgeProps) {
  const c = resolveStatusColor(color);
  return (
    <XStack
      alignItems="center"
      gap={5}
      paddingVertical={3}
      paddingHorizontal={8}
      borderRadius={9}
      backgroundColor={c.fill}
      flexShrink={0}
    >
      <View width={6} height={6} borderRadius={3} backgroundColor={c.tint} />
      <Text fontSize={11.5} fontWeight="$button" color={c.tint} numberOfLines={1}>
        {label}
      </Text>
    </XStack>
  );
}
