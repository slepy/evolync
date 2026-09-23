import { User } from "lucide-react-native";
import React from "react";
import { Card, Text, XStack, YStack, useTheme } from "tamagui";

import { type EventParticipantStatus } from "@/database/models/EventParticipant";
import {
  PARTICIPANT_STATUS_CONFIG,
  PARTICIPANT_STATUS_CYCLE,
} from "../constants";
import {
  CardInfo,
  StatusIndicator,
  Thumbnail,
  BaseCard,
} from "@/modules/core/components";

// ============================================================================
// Types
// ============================================================================

interface EventParticipantRowProps {
  memberName: string;
  memberEmail?: string;
  status: EventParticipantStatus;
  onToggle: (newStatus: EventParticipantStatus) => void;
}

// ============================================================================
// EventParticipantRow Component
// ============================================================================

export const EventParticipantRow: React.FC<EventParticipantRowProps> = ({
  memberName,
  memberEmail,
  status,
  onToggle,
}) => {
  const theme = useTheme();
  const config = PARTICIPANT_STATUS_CONFIG[status];
  const IconComponent = config.icon;

  // Cycle through statuses on tap
  const handlePress = () => {
    const currentIndex = PARTICIPANT_STATUS_CYCLE.indexOf(status);
    const nextIndex = (currentIndex + 1) % PARTICIPANT_STATUS_CYCLE.length;
    const nextStatus = PARTICIPANT_STATUS_CYCLE[nextIndex];
    onToggle(nextStatus);
  };

  return (
    <BaseCard
      onPress={handlePress}
      backgroundColor={config.bgColor}
      borderColor={config.color}
    >
      <XStack gap="$3" alignItems="center">
        <Thumbnail
          backgroundColor={config.bgColor}
          borderColor={config.color}
        />

        <CardInfo displayName={memberName} subtitle={memberEmail} />

        <StatusIndicator
          icon={<IconComponent />}
          color={config.color}
          onPress={handlePress}
        />
      </XStack>
    </BaseCard>
  );
};
