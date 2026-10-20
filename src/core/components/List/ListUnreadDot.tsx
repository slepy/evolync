import { View } from "tamagui";

/** Unread marker (notifications). */
export function ListUnreadDot() {
  return <View width={8} height={8} borderRadius={4} backgroundColor="$alertDot" flexShrink={0} />;
}
