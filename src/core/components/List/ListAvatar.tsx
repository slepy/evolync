import { Image, StyleSheet } from "react-native";
import { Text, View } from "tamagui";
import { isDarkColor, rankCornerSize, type ListAvatarSize } from "./avatar";

const AVATAR_RADIUS: Record<ListAvatarSize, number | "$rowIcon"> = { 64: 20, 48: "$rowIcon", 44: 14, 36: 12 };

export interface ListAvatarProps {
  initials: string;
  /** Profile photo; shown instead of the initials when set. */
  uri?: string | null;
  size?: ListAvatarSize;
  /** Belt color of the member's rank; no corner without a rank. */
  rankColor?: string | null;
  /** Archived member: the avatar fades. */
  dimmed?: boolean;
}

/**
 * Neutral avatar: the person's photo, otherwise initials (people belong to no
 * module). With `rankColor` the top-right corner is cut in the belt color (16A).
 */
export function ListAvatar({ initials, uri, size = 44, rankColor, dimmed }: ListAvatarProps) {
  const corner = rankCornerSize(size);

  return (
    <View
      width={size}
      height={size}
      borderRadius={AVATAR_RADIUS[size]}
      overflow="hidden"
      backgroundColor="$neutralTintFill"
      alignItems="center"
      justifyContent="center"
      opacity={dimmed ? 0.55 : 1}
      flexShrink={0}
    >
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
      ) : (
        <Text fontSize={size === 64 ? 20 : size === 36 ? 13 : 14} fontWeight="$button" color="$neutralTint">
          {initials}
        </Text>
      )}
      {rankColor ? (
        <View
          position="absolute"
          top={-corner / 2}
          right={-corner / 2}
          width={corner}
          height={corner}
          rotate="45deg"
          backgroundColor={rankColor}
          // A black belt would vanish on the dark page: outline it like the board does.
          borderWidth={isDarkColor(rankColor) ? 1 : 0}
          borderColor="$neutralControl"
        />
      ) : null}
    </View>
  );
}
