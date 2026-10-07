import type { LucideIcon } from "lucide-react-native";
import { Text, View, YStack } from "tamagui";
import { resolveStatusColor, type StatusColor } from "../StatusBadge/statusColor";
import { withAlpha } from "../List/accent";

export interface StatusHeroProps {
  icon: LucideIcon;
  /** 26/800 ("Request sent"). */
  title: string;
  /** Muted line under the title: what happens next. */
  text?: string;
  /** Status the screen ends in (Join a school: Pending amber). */
  color: StatusColor;
}

/**
 * Centered outcome of a flow (Join a school "Request sent"): 88px circle in
 * the status color with a soft 10px halo, title and a muted line.
 */
export function StatusHero({ icon: Icon, title, text, color }: StatusHeroProps) {
  const c = resolveStatusColor(color);
  const halo = c.tint.startsWith("#") ? withAlpha(c.tint, 0.06) : c.fill;

  return (
    <YStack alignItems="center" gap={18} paddingHorizontal={8}>
      <View width={108} height={108} borderRadius={54} backgroundColor={halo} alignItems="center" justifyContent="center">
        <View width={88} height={88} borderRadius={44} backgroundColor="$neutralPage">
          <View flex={1} borderRadius={44} backgroundColor={c.fill} alignItems="center" justifyContent="center">
            <Icon size={40} color={c.tint} strokeWidth={2.2} />
          </View>
        </View>
      </View>
      <Text fontSize={26} lineHeight={31} fontWeight="$section" letterSpacing={-0.4} color="$neutralText" textAlign="center">
        {title}
      </Text>
      {text ? (
        <Text fontSize={14} lineHeight={21} fontWeight="$secondary" color="$neutralMuted" textAlign="center">
          {text}
        </Text>
      ) : null}
    </YStack>
  );
}
