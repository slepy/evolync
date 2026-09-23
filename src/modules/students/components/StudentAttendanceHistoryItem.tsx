import { Calendar } from "lucide-react-native";
import { format } from "date-fns";
import React from "react";
import { XStack } from "tamagui";
import {
  type AttendanceStatus,
  STATUS_CYCLE,
} from "@/database/models/AttendanceRecord";
import { STATUS_CONFIG } from "@/modules/attendance/constants";
import {
  BaseCard,
  CardInfo,
  StatusIndicator,
  Thumbnail,
} from "@/modules/core/components";

// ============================================================================
// Types
// ============================================================================

interface StudentAttendanceHistoryItemProps {
  recordId: string;
  date: Date;
  status: AttendanceStatus;
  onToggle?: (recordId: string, newStatus: AttendanceStatus) => void;
  disabled?: boolean;
}

// ============================================================================
// StudentAttendanceHistoryItem Component
// ============================================================================

export const StudentAttendanceHistoryItem: React.FC<
  StudentAttendanceHistoryItemProps
> = ({ recordId, date, status, onToggle, disabled = false }) => {
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;

  // Cycle through statuses on tap (only if not disabled)
  const handlePress = () => {
    if (disabled || !onToggle) return;
    const currentIndex = STATUS_CYCLE.indexOf(status);
    const nextIndex = (currentIndex + 1) % STATUS_CYCLE.length;
    const nextStatus = STATUS_CYCLE[nextIndex];
    onToggle(recordId, nextStatus);
  };

  return (
    <BaseCard onPress={handlePress} marginHorizontal="$0">
      <XStack gap="$3" alignItems="center">
        <Thumbnail
          icon={<Calendar />}
          backgroundColor="$darkBlueLighter"
          borderColor="$darkBlue"
        />

        <CardInfo
          displayName={format(date, "d MMMM yyyy")}
          subtitle={format(date, "EEEE")}
        />

        <StatusIndicator
          icon={<StatusIcon />}
          color={config.color}
          onPress={handlePress}
        />
      </XStack>
    </BaseCard>
  );
};
