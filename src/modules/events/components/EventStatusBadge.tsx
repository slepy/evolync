import React from "react";
import { Text, XStack } from "tamagui";
import {
  EVENT_PARTICIPANT_STATUS,
  type EventParticipantStatus,
} from "@/database/models/EventParticipant";
import { EVENT_STATUS, type EventStatus } from "@/database/models/Event";

// ============================================================================
// Constants
// ============================================================================

export const BADGE_VARIANT = {
  PARTICIPANT: "participant",
  EVENT: "event",
} as const;

export type BadgeVariant = (typeof BADGE_VARIANT)[keyof typeof BADGE_VARIANT];

// ============================================================================
// Types
// ============================================================================

interface EventStatusBadgeProps {
  status: EventParticipantStatus | EventStatus;
  variant?: BadgeVariant;
}

// ============================================================================
// Helper Functions
// ============================================================================

const getParticipantStatusConfig = (status: EventParticipantStatus) => {
  switch (status) {
    case EVENT_PARTICIPANT_STATUS.PAID:
      return {
        label: t("statusPaid"),
        backgroundColor: "$jadeGreenLighter",
        textColor: "$jadeGreenDark",
        borderColor: "$jadeGreen",
      };
    case EVENT_PARTICIPANT_STATUS.ATTENDING:
      return {
        label: t("statusAttending"),
        backgroundColor: "$chineseGoldLighter",
        textColor: "$chineseGoldDark",
        borderColor: "$chineseGold",
      };
    case EVENT_PARTICIPANT_STATUS.ABSENT:
    default:
      return {
        label: t("statusAbsent"),
        backgroundColor: "$softGrayLighter",
        textColor: "$softGrayDark",
        borderColor: "$softGray",
      };
  }
};

const getEventStatusConfig = (status: EventStatus) => {
  switch (status) {
    case EVENT_STATUS.CANCELLED:
      return {
        label: t("statusCancelled"),
        backgroundColor: "$imperialRedLighter",
        textColor: "$imperialRedDark",
        borderColor: "$imperialRed",
      };
    case EVENT_STATUS.ACTIVE:
    default:
      return {
        label: t("statusActive"),
        backgroundColor: "$jadeGreenLighter",
        textColor: "$jadeGreenDark",
        borderColor: "$jadeGreen",
      };
  }
};

// ============================================================================
// EventStatusBadge Component
// ============================================================================

export const EventStatusBadge: React.FC<EventStatusBadgeProps> = ({
  status,
  variant = BADGE_VARIANT.PARTICIPANT,
}) => {
  const config =
    variant === BADGE_VARIANT.EVENT
      ? getEventStatusConfig(status as EventStatus)
      : getParticipantStatusConfig(status as EventParticipantStatus);

  return (
    <XStack
      backgroundColor={config.backgroundColor}
      paddingHorizontal="$2"
      paddingVertical="$1"
      borderRadius="$2"
      borderWidth={1}
      borderColor={config.borderColor}
    >
      <Text fontSize="$1" fontWeight="600" color={config.textColor}>
        {config.label}
      </Text>
    </XStack>
  );
};
