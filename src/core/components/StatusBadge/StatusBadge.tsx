import { Text, View, XStack } from "tamagui";
import { resolveStatusColor, type StatusColor } from "./statusColor";

export interface StatusBadgeProps {
  label: string;
  color: StatusColor;
  /** "sm" (default): list row. "md": the Status row of a details screen (12D). */
  size?: "sm" | "md";
}

/**
 * Mini status badge on the right of a list row, under the amount (board S
 * section 10, 12A): dot + name in the status color on its tinted fill.
 * Read-only: the row is the link.
 */
export function StatusBadge({ label, color, size = "sm" }: StatusBadgeProps) {
  const c = resolveStatusColor(color);
  const md = size === "md";
  return (
    <XStack
      alignItems="center"
      gap={md ? 6 : 5}
      paddingVertical={md ? 5 : 3}
      paddingHorizontal={md ? 10 : 8}
      borderRadius={md ? 10 : 9}
      backgroundColor={c.fill}
      flexShrink={0}
    >
      <View width={md ? 7 : 6} height={md ? 7 : 6} borderRadius={4} backgroundColor={c.tint} />
      <Text fontSize={md ? 13 : 11.5} fontWeight="$button" color={c.tint} numberOfLines={1}>
        {label}
      </Text>
    </XStack>
  );
}
