import type Training from "@/database/models/Training";
import { TRAINING_STATUS, TRAINING_VISIBILITY } from "@/database/models/Training";
import { Badge, BaseCard } from "@/modules/core/components";
import { Clock, MapPin, Repeat } from "lucide-react-native";
import React from "react";
import { Text, XStack, YStack, useTheme } from "tamagui";

interface TrainingCardProps {
  training: Training;
  /** Name of the training's school (school visibility); undefined when removed. */
  schoolName?: string;
  onPress?: () => void;
}

/** Audience label: organization, the school's name, or selected people. */
export const audienceLabel = (training: Training, schoolName?: string): string => {
  if (training.visibility === TRAINING_VISIBILITY.SCHOOL) return schoolName ?? t("trainingsSchoolRemoved");
  if (training.visibility === TRAINING_VISIBILITY.WHITELIST) return t("trainingsAudiencePeople");
  return t("trainingsAudienceOrganization");
};

export const TrainingCard: React.FC<TrainingCardProps> = ({ training, schoolName, onPress }) => {
  const theme = useTheme();
  const isCancelled = training.status === TRAINING_STATUS.CANCELLED;
  const schoolRemoved = training.visibility === TRAINING_VISIBILITY.SCHOOL && !schoolName;
  const muted = theme.textSecondary?.val;

  return (
    <BaseCard onPress={onPress} opacity={isCancelled ? 0.7 : 1} padding="$3">
      <YStack gap="$1.5">
        <XStack justifyContent="space-between" alignItems="flex-start" gap="$2">
          <XStack flex={1} gap="$1.5" alignItems="center">
            <Text
              fontSize="$5"
              fontWeight="700"
              color={isCancelled ? "$textMuted" : "$textPrimary"}
              textDecorationLine={isCancelled ? "line-through" : "none"}
              numberOfLines={1}
              flexShrink={1}
            >
              {training.name}
            </Text>
            {training.seriesId && <Repeat size={14} color={muted} accessibilityLabel={t("trainingsModeRecurring")} />}
          </XStack>
          {isCancelled ? (
            <Badge title={t("statusCancelled")} backgroundColor="$dangerSurface" textColor="$dangerText" />
          ) : (
            <Badge
              title={audienceLabel(training, schoolName)}
              backgroundColor={schoolRemoved ? "$warningSurface" : "$fillSubtle"}
              textColor={schoolRemoved ? "$warningText" : "$textSecondary"}
            />
          )}
        </XStack>

        <XStack gap="$4" alignItems="center" flexWrap="wrap">
          <XStack gap="$1.5" alignItems="center">
            <Clock size={14} color={muted} />
            <Text fontSize="$3" color="$textSecondary">
              {training.startTime}–{training.endTime}
            </Text>
          </XStack>
          {training.location && (
            <XStack gap="$1.5" alignItems="center" flex={1}>
              <MapPin size={14} color={muted} />
              <Text fontSize="$3" color="$textSecondary" numberOfLines={1} flex={1}>
                {training.location}
              </Text>
            </XStack>
          )}
        </XStack>
      </YStack>
    </BaseCard>
  );
};
