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
  size?: 48 | 44 | 36 | 32;
}) {
  const a = resolveListAccent(accent);
  return (
    <View
      width={size}
      height={size}
      borderRadius={size === 48 ? "$rowIcon" : size === 44 ? 14 : size === 36 ? 12 : 10}
      backgroundColor={a.fill}
      alignItems="center"
      justifyContent="center"
      flexShrink={0}
    >
      <Icon size={size === 32 ? 16 : size === 36 ? 18 : 22} color={a.tint} strokeWidth={2} />
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

/** Neutral avatar: the person's photo, otherwise initials (people belong to no module). */
export function ListAvatar({
  initials,
  uri,
  size = 44,
}: {
  initials: string;
  /** Profile photo; shown instead of the initials when set. */
  uri?: string | null;
  size?: 48 | 44 | 36;
}) {
  if (uri) {
    return (
      <View
        width={size}
        height={size}
        borderRadius={size === 48 ? "$rowIcon" : size === 44 ? 14 : 12}
        overflow="hidden"
        backgroundColor="$neutralTintFill"
        flexShrink={0}
      >
        <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
      </View>
    );
  }

  return (
    <View
      width={size}
      height={size}
      borderRadius={size === 48 ? "$rowIcon" : size === 44 ? 14 : 12}
      backgroundColor="$neutralTintFill"
      alignItems="center"
      justifyContent="center"
      flexShrink={0}
    >
      <Text fontSize={size === 36 ? 13 : 14} fontWeight="$button" color="$neutralTint">
        {initials}
      </Text>
    </View>
  );
}

// ============================================================================
// Trailing slot
// ============================================================================

/** Count / status chip ("3 selected", "8/12", "86%", "Pending"). */
export function ListChip({ label, accent = "neutral" }: { label: string; accent?: ListAccent }) {
  const a = resolveListAccent(accent);
  return (
    <View paddingVertical={3} paddingHorizontal={9} borderRadius={9} backgroundColor={a.fill} flexShrink={0}>
      <Text fontSize={12.5} fontWeight="$button" color={a.tint} numberOfLines={1}>
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
