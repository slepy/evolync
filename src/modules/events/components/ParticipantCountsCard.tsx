import React from "react";
import { Text, XStack, YStack } from "tamagui";
import { PARTICIPANT_STATUS_CYCLE, PARTICIPANT_STATUS_STYLE } from "../constants";
import type { ParticipantCounts as Counts } from "../hooks/useEventParticipants";

/** Absent / Attending / Paid counters in one card (10C, 10D). */
export const ParticipantCountsCard: React.FC<{ counts: Counts }> = ({ counts }) => (
  <XStack
    paddingVertical={16}
    paddingHorizontal={8}
    borderRadius="$card"
    backgroundColor="$neutralCard"
    borderWidth={1}
    borderColor="$neutralCardBorder"
  >
    {PARTICIPANT_STATUS_CYCLE.map((status) => {
      const { icon: Icon, tint, label } = PARTICIPANT_STATUS_STYLE[status];
      return (
        <YStack key={status} flex={1} alignItems="center" gap={4}>
          <Icon size={20} color={tint} strokeWidth={2.2} />
          <Text fontSize={22} fontWeight="$title" color={tint}>
            {counts[status]}
          </Text>
          <Text fontSize={12} fontWeight="600" color="$neutralMuted">
            {t(label)}
          </Text>
        </YStack>
      );
    })}
  </XStack>
);
