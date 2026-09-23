import type { LucideIcon } from "lucide-react-native";
import React from "react";
import { TouchableOpacity } from "react-native";
import { Text, useTheme, XStack, YStack } from "tamagui";

// ============================================================================
// Types
// ============================================================================

interface DashboardStatCardProps {
  /** Display title of the stat */
  title: string;
  /** Icon component from lucide-icons */
  Icon: LucideIcon;
  /** Icon color */
  iconColor?: string;
  /** Background color of the icon container */
  iconBackground?: string;
  /** Optional badge count (e.g., pending items) */
  badgeCount?: number;
  /** Callback when card is pressed */
  onPress?: () => void;
}

// ============================================================================
// DashboardStatCard Component
// ============================================================================

/**
 * Stat card component for displaying key metrics on the dashboard.
 *
 * Features:
 * - Displays an icon, title, and optional subtitle
 * - Optional badge for pending/alert counts
 * - Pressable with navigation support
 * - Responsive and accessible design
 *
 * Used for Students, Payments, Orders, Attendance, and Communication tiles.
 */
export const DashboardStatCard: React.FC<DashboardStatCardProps> = ({
  title,
  Icon,
  iconColor = "$blue11",
  iconBackground = "$blue3",
  badgeCount,
  onPress,
}) => {
  const theme = useTheme();

  // Resolve Tamagui color tokens to actual color values for Lucide icons
  const resolvedIconColor = iconColor.startsWith("$")
    ? theme[iconColor.slice(1)]?.val || iconColor
    : iconColor;

  return (
    <YStack gap="$3" alignItems="center">
      {/* Icon and Badge Row */}
      <XStack
        justifyContent="center"
        alignItems="center"
        width="100%"
        position="relative"
      >
        {/* Icon Container */}
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
          <XStack
            width={56}
            height={56}
            backgroundColor={iconBackground}
            borderRadius="$5"
            justifyContent="center"
            alignItems="center"
            borderWidth={0.2}
            borderColor={iconColor}
            pointerEvents="none"
          >
            <Icon size={28} color={resolvedIconColor} strokeWidth={2.5} />

            {/* Badge */}
            {badgeCount !== undefined && badgeCount > 0 && (
              <XStack
                position="absolute"
                top={-8}
                right={-8}
                backgroundColor="$imperialRed"
                paddingHorizontal="$2"
                paddingVertical="$1"
                borderRadius="$5"
                minWidth={24}
                justifyContent="center"
                alignItems="center"
              >
                <Text fontSize="$2" fontWeight="700" color="$pearlWhiteLight">
                  {badgeCount > 99 ? "99+" : badgeCount}
                </Text>
              </XStack>
            )}
          </XStack>
        </TouchableOpacity>
      </XStack>

      {/* Title */}
      <Text
        fontSize="$3"
        fontWeight="700"
        color="$inkBlackLight"
        numberOfLines={1}
      >
        {title}
      </Text>
    </YStack>
  );
};
