import { LinearGradient } from "expo-linear-gradient";
import { Check, Plus, type LucideIcon } from "lucide-react-native";
import { Image, StyleSheet } from "react-native";
import { Text, View } from "tamagui";
import { resolveListAccent, type ListAccent } from "./accent";

// ============================================================================
// Leading slot
// ============================================================================

/** Module-tinted icon square: 48px in "lg" rows, 44px in "md" rows, 32px in front of a toggle row (14B "Amounts"). */
export function ListIcon({
  icon: Icon,
  accent = "neutral",
  size = 48,
}: {
  icon: LucideIcon;
  accent?: ListAccent;
  size?: 48 | 44 | 40 | 36 | 32;
}) {
  const a = resolveListAccent(accent);
  return (
    <View
      width={size}
      height={size}
      borderRadius={size === 48 ? "$rowIcon" : size === 44 || size === 40 ? 14 : size === 36 ? 12 : 10}
      backgroundColor={a.fill}
      alignItems="center"
      justifyContent="center"
      flexShrink={0}
    >
      <Icon size={size === 32 ? 16 : size === 36 ? 18 : size === 40 ? 20 : 22} color={a.tint} strokeWidth={2} />
    </View>
  );
}

/** Photo in the icon square (product image); without a photo, the module-tinted `ListIcon`. */
export function ListImage({
  uri,
  icon,
  accent = "neutral",
  size = 48,
}: {
  uri?: string | null;
  icon: LucideIcon;
  accent?: ListAccent;
  size?: 48 | 44 | 36;
}) {
  if (!uri) return <ListIcon icon={icon} accent={accent} size={size} />;
  return (
    <View
      width={size}
      height={size}
      borderRadius={size === 48 ? "$rowIcon" : size === 44 ? 14 : 12}
      overflow="hidden"
      backgroundColor={resolveListAccent(accent).fill}
      flexShrink={0}
    >
      <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
    </View>
  );
}

export type ListAvatarSize = 64 | 48 | 44 | 36;

const AVATAR_RADIUS: Record<ListAvatarSize, number | "$rowIcon"> = { 64: 20, 48: "$rowIcon", 44: 14, 36: 12 };

/** Side of the rotated square that draws the rank corner (16A: 26px on a 44px avatar, 16E: 38px on 64px). */
export const rankCornerSize = (size: ListAvatarSize): number => Math.round(size * 0.59);

/**
 * Neutral avatar: the person's photo, otherwise initials (people belong to no
 * module). With `rankColor` the top-right corner is cut in the belt color (16A).
 */
export function ListAvatar({
  initials,
  uri,
  size = 44,
  rankColor,
  dimmed,
}: {
  initials: string;
  /** Profile photo; shown instead of the initials when set. */
  uri?: string | null;
  size?: ListAvatarSize;
  /** Belt color of the member's rank; no corner without a rank. */
  rankColor?: string | null;
  /** Archived member: the avatar fades. */
  dimmed?: boolean;
}) {
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

/** True for colors too dark to see on the page (black belt). */
function isDarkColor(color: string): boolean {
  const hex = color.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return false;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.299 * r! + 0.587 * g! + 0.114 * b! < 48;
}

// ============================================================================
// Trailing slot
// ============================================================================

/** Count / status chip ("3 selected", "8/12", "86%", "Pending"). */
export function ListChip({ label, accent = "neutral" }: { label: string; accent?: ListAccent }) {
  const a = resolveListAccent(accent);
  return (
    <View paddingVertical={3} paddingHorizontal={9} borderRadius={9} backgroundColor={a.fill} flexShrink={0}>
      <Text fontSize={12.5} fontWeight="$button" color={a.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** Square checkbox on the right of a checkbox-list row (board S section 5). */
export function ListCheckbox({ checked, accent = "neutral" }: { checked: boolean; accent?: ListAccent }) {
  if (!checked) {
    return (
      <View width={24} height={24} borderRadius="$chip" borderWidth={1.5} borderColor="$neutralControl" flexShrink={0} />
    );
  }

  const a = resolveListAccent(accent);
  return (
    <View width={24} height={24} borderRadius="$chip" overflow="hidden" alignItems="center" justifyContent="center" flexShrink={0}>
      <LinearGradient colors={[a.from, a.to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <Check size={14} color={a.onGradient} strokeWidth={3} />
    </View>
  );
}

/** Plain check marking the chosen row of a select sheet (board S section 7). */
export function ListCheck({ accent = "neutral" }: { accent?: ListAccent }) {
  return <Check size={20} color={resolveListAccent(accent).tint} strokeWidth={2.6} />;
}

/** Unread marker (notifications). */
export function ListUnreadDot() {
  return <View width={8} height={8} borderRadius={4} backgroundColor="$alertDot" flexShrink={0} />;
}

/** `+` quick action on the right of a row (same as the module tile's): 40px circle, accent fill. */
export function ListAddButton({
  onPress,
  label,
  accent = "neutral",
}: {
  onPress: () => void;
  /** Accessible label (default: "Add"). */
  label?: string;
  accent?: ListAccent;
}) {
  const a = resolveListAccent(accent);
  return (
    <View
      role="button"
      aria-label={label ?? t("add")}
      onPress={onPress}
      pressStyle={{ opacity: 0.8 }}
      hitSlop={4}
      width={40}
      height={40}
      borderRadius={20}
      backgroundColor={a.fill}
      alignItems="center"
      justifyContent="center"
      flexShrink={0}
    >
      <Plus size={18} color={a.tint} strokeWidth={2.8} />
    </View>
  );
}
