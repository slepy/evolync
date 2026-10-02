import { Calendar, CalendarDays, MapPin } from "lucide-react-native";
import React from "react";
import { Text, XStack, YStack, useTheme } from "tamagui";

import type Event from "@/database/models/Event";
import { EVENT_STATUS } from "@/database/models/Event";
import type { EventParticipantStatus } from "@/database/models/EventParticipant";
import { BaseCard, CardInfo, Thumbnail } from "@/modules/core/components";
import { formatPrice, formatDateRange } from "@/modules/core/utils/formatters";
import { EventStatusBadge, BADGE_VARIANT } from "./EventStatusBadge";

// ============================================================================
// Types
// ============================================================================

interface EventCardProps {
  event: Event;
  userStatus?: EventParticipantStatus;
  onPress: () => void;
}

// ============================================================================
// EventCard Component
// ============================================================================

export const EventCard: React.FC<EventCardProps> = ({
  event,
  userStatus,
  onPress,
}) => {
  const theme = useTheme();
  const isCancelled = event.status === EVENT_STATUS.CANCELLED;

  return (
    <BaseCard onPress={onPress} opacity={isCancelled ? 0.7 : 1}>
      <XStack gap="$3" alignItems="center">
        <Thumbnail
          backgroundColor="$warningSurface"
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

            {/* User participation status or event cancelled status */}
            {isCancelled ? (
              <EventStatusBadge
                status={EVENT_STATUS.CANCELLED}
                variant={BADGE_VARIANT.EVENT}
              />
            ) : userStatus ? (
              <EventStatusBadge
                status={userStatus}
                variant={BADGE_VARIANT.PARTICIPANT}
              />
            ) : null}
          </XStack>

          {/* Info Row: Date, Location, Price */}
          <XStack gap="$4" alignItems="center" flexWrap="wrap">
            {/* Date */}
            <XStack alignItems="center" gap="$1.5" flex={1}>
              <Calendar
                size={14}
                color={theme.textSecondary?.val}
                strokeWidth={2}
              />
              <Text fontSize="$2" color="$textSecondary">
                {formatDateRange(event.startDate, event.endDate)}
              </Text>
            </XStack>

            {/* Location */}
            {event.address && (
              <XStack alignItems="center" gap="$1.5" flex={1}>
                <MapPin
                  size={14}
                  color={theme.textSecondary?.val}
                  strokeWidth={2}
                />
                <Text
                  fontSize="$2"
                  color="$textSecondary"
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
