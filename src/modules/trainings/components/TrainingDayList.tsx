import type Training from "@/database/models/Training";
import { CalendarClock } from "lucide-react-native";
import React, { useMemo } from "react";
import { SectionList } from "react-native";
import { Text, YStack, useTheme } from "tamagui";
import { localToday } from "../types/helpers";
import { formatDayLong } from "./format";
import { groupTrainingsByDay } from "./groupByDay";
import { TrainingCard } from "./TrainingCard";

interface TrainingDayListProps {
  trainings: Training[];
  schoolNames: Map<string, string>;
  onPressTraining?: (training: Training) => void;
  emptyTitle: string;
  emptyHint?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
}

/** Upcoming trainings grouped by day. */
export const TrainingDayList: React.FC<TrainingDayListProps> = ({
  trainings,
  schoolNames,
  onPressTraining,
  emptyTitle,
  emptyHint,
  refreshing = false,
  onRefresh,
}) => {
  const theme = useTheme();
  const sections = useMemo(() => groupTrainingsByDay(trainings), [trainings]);
  const today = localToday();

  if (sections.length === 0) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4" gap="$2">
        <CalendarClock size={48} color={theme.textMuted?.val} />
        <Text color="$textMuted" fontSize="$5" textAlign="center">
          {emptyTitle}
        </Text>
        {emptyHint && (
          <Text color="$textSecondary" fontSize="$3" textAlign="center">
            {emptyHint}
          </Text>
        )}
      </YStack>
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingBottom: 120 }}
      stickySectionHeadersEnabled={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
      renderSectionHeader={({ section }) => (
        <Text
          fontSize="$4"
          fontWeight="700"
          color={section.day === today ? "$chineseGold" : "$textPrimary"}
          paddingHorizontal="$4"
          paddingTop="$4"
          paddingBottom="$1"
          textTransform="capitalize"
        >
          {formatDayLong(section.day)}
        </Text>
      )}
      renderItem={({ item }) => (
        <TrainingCard
          training={item}
          schoolName={item.schoolId ? schoolNames.get(item.schoolId) : undefined}
          onPress={onPressTraining ? () => onPressTraining(item) : undefined}
        />
      )}
    />
  );
};
