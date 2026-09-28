import React from "react";
import { XStack } from "tamagui";

import {
  type AttendanceStatus,
  STATUS_CYCLE,
} from "@/database/models/AttendanceRecord";
import {
  Thumbnail,
  CardInfo,
  BaseCard,
  StatusIndicator,
} from "@/modules/core/components";
import type { AttendanceWithMember } from "../hooks/useAttendance";
import { STATUS_CONFIG } from "../constants";
import { useRankById } from "@/modules/grading";

// ============================================================================
// Types
// ============================================================================

interface AttendanceListItemProps {
  item: AttendanceWithMember;
  onToggle: (memberId: string, newStatus: AttendanceStatus) => void;
}

// ============================================================================
// AttendanceListItem Component
// ============================================================================

export const AttendanceListItem: React.FC<AttendanceListItemProps> = ({
  item,
  onToggle,
}) => {
  const config = STATUS_CONFIG[item.status];
  const IconComponent = config.icon as React.ComponentType;
  const rank = useRankById(item.member.currentRankId);

  // Cycle through statuses on tap
  const handlePress = () => {
    if (item.disabled) return;
    const currentIndex = STATUS_CYCLE.indexOf(item.status);
    const nextIndex = (currentIndex + 1) % STATUS_CYCLE.length;
    const nextStatus = STATUS_CYCLE[nextIndex];
    onToggle(item.member.id, nextStatus);
  };

  return (
    <BaseCard onPress={handlePress} opacity={item.disabled ? 0.5 : 1}>
      <XStack gap="$3" alignItems="center">
        <Thumbnail rankColor={rank?.color} imageUrl={item.member.avatarUrl} />

        <CardInfo
          displayName={item.member.displayName ?? ""}
          subtitle={item.member.email}
        />

        <StatusIndicator
          icon={<IconComponent />}
          color={config.color}
          onPress={handlePress}
        />
      </XStack>
    </BaseCard>
  );
};
