import { Calendar, Users } from "lucide-react-native";
import React from "react";
import type { ColorTokens } from "tamagui";
import { Text, XStack, YStack, useTheme } from "tamagui";

import type TrainingSession from "@/database/models/TrainingSession";
import {
  BaseCard,
  CardInfo,
  Thumbnail,
  Badge,
} from "@/modules/core/components";

// ============================================================================
// Types
// ============================================================================

interface TrainingSessionCardProps {
  session: TrainingSession;
  attendanceCount?: number;
  totalMembers?: number;
  onPress: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Formats date for display
 */
const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

/**
 * Checks if session is today
 */
const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

// ============================================================================
// TrainingSessionCard Component
// ============================================================================

export const TrainingSessionCard: React.FC<TrainingSessionCardProps> = ({
  session,
  attendanceCount = 0,
  totalMembers = 0,
  onPress,
}) => {
  const iconColor: ColorTokens = "$darkBlue";
  const isTodaySession = isToday(session.sessionDate);

  return (
    <BaseCard
      onPress={onPress}
      backgroundColor={
        isTodaySession ? "$darkBlueLighter" : "rgba(255, 255, 255, 0.7)"
      }
      borderColor={isTodaySession ? "$darkBlueLighter" : "$borderColor"}
    >
      <XStack gap="$3" alignItems="center">
        <XStack flex={1} gap="$3" alignItems="center">
          <Thumbnail
            backgroundColor={"$darkBlueLighter"}
            borderColor={iconColor}
            icon={<Calendar />}
          />

          <CardInfo
            displayName={formatDate(session.sessionDate)}
            subtitle={`${attendanceCount} / ${totalMembers} ${t("statusPresent")}`}
          />
        </XStack>

        {isTodaySession && (
          <XStack justifyContent="flex-end">
            <Badge
              backgroundColor="$darkBlueLight"
              textColor="$pearlWhite"
              title={t("attendanceToday")}
            />
          </XStack>
        )}
      </XStack>
    </BaseCard>
  );
};
