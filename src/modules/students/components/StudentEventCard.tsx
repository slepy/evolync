import React from "react";
import { Calendar, CalendarDays, MapPin } from "lucide-react-native";
import { Text, XStack, YStack, useTheme } from "tamagui";
import type Event from "@/database/models/Event";
import type { EventParticipantStatus } from "@/database/models/EventParticipant";
import { BaseCard, CardInfo, Thumbnail } from "@/modules/core/components";
import { formatPrice, formatDateRange } from "@/modules/core/utils/formatters";
import {
  EventStatusBadge,
  BADGE_VARIANT,
} from "@/modules/events/components/EventStatusBadge";

// ============================================================================
// Types
// ============================================================================

interface StudentEventCardProps {
  event: Event;
  participantStatus: EventParticipantStatus;
  onPress: () => void;
  /** Whether this card has a pending (unsaved) status change */
  hasPendingChange?: boolean;
}

// ============================================================================
// StudentEventCard Component
// ============================================================================

export const StudentEventCard: React.FC<StudentEventCardProps> = ({
  event,
  participantStatus,
  onPress,
  hasPendingChange = false,
}) => {
  const theme = useTheme();

  return (
    <BaseCard
      onPress={onPress}
      borderColor={hasPendingChange ? "$chineseGold" : undefined}
      borderWidth={hasPendingChange ? 1 : undefined}
    >
      <XStack gap="$3" alignItems="center">
        <Thumbnail
          backgroundColor="$chineseGoldLighter"
          borderColor="$chineseGold"
          icon={<CalendarDays />}
        />
        <YStack gap="$2" flex={1}>
          {/* Header: Name and Status */}
          <XStack
            justifyContent="space-between"
            alignItems="flex-start"
            gap="$2"
          >
            <CardInfo displayName={event.name} subtitle={event.shortNote} />

            {/* Participant status badge */}
            <EventStatusBadge
              status={participantStatus}
              variant={BADGE_VARIANT.PARTICIPANT}
            />
          </XStack>

          {/* Info Row: Date, Location, Price */}
          <XStack gap="$4" alignItems="center" flexWrap="wrap">
            {/* Date */}
            <XStack alignItems="center" gap="$1.5" flex={1}>
              <Calendar
                size={14}
                color={theme.softGrayDark?.val}
                strokeWidth={2}
              />
              <Text fontSize="$2" color="$softGrayDark">
                {formatDateRange(event.startDate, event.endDate)}
              </Text>
            </XStack>

            {/* Location */}
            {event.address && (
              <XStack alignItems="center" gap="$1.5" flex={1}>
                <MapPin
                  size={14}
                  color={theme.softGrayDark?.val}
                  strokeWidth={2}
                />
                <Text
                  fontSize="$2"
                  color="$softGrayDark"
                  numberOfLines={1}
                  flex={1}
                >
                  {event.address}
                </Text>
              </XStack>
            )}

            {/* Price */}
            <XStack justifyContent="flex-end" flex={1}>
              <Text fontSize="$3" fontWeight="700" color="$jadeGreen">
                {formatPrice(event.price, event.currency)}
              </Text>
            </XStack>
          </XStack>
        </YStack>
      </XStack>
    </BaseCard>
  );
};
