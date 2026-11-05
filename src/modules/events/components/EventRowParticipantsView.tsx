import { MemberAvatar } from "@/core/components";
import { moduleAccents } from "@/core/theme/tokens";
import React from "react";
import { ActivityIndicator } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import type { EventRowParticipant } from "../types";
import { ParticipantStatusIcon } from "./ParticipantStatusIcon";

export interface EventRowParticipantsViewProps {
  participants: readonly EventRowParticipant[];
  isLoading: boolean;
  /** A tap on any participant opens the event's Participants screen. */
  onParticipantPress: () => void;
}

/**
 * Participants of an expanded event row in the List view: avatar, name and
 * a read-only status icon each. A tap on a participant opens the
 * Participants screen, where the statuses change.
 */
export const EventRowParticipantsView: React.FC<EventRowParticipantsViewProps> = ({
  participants,
  isLoading,
  onParticipantPress,
}) => {
  if (isLoading) return <ActivityIndicator color={moduleAccents.events.tint} />;

  if (participants.length === 0) {
    return (
      <Text fontSize={13} fontWeight="$secondary" color="$neutralMuted">
        {t("emptyNoParticipants")}
      </Text>
    );
  }

  return (
    <YStack role="list" aria-label={t("eventsParticipants")} gap={8}>
      {participants.map((participant) => (
        <YStack key={participant.id} role="listitem">
          <XStack
            role="button"
            aria-label={participant.name}
            accessibilityHint={t("eventsManageParticipants")}
            onPress={onParticipantPress}
            pressStyle={{ opacity: 0.85 }}
            alignItems="center"
            gap={12}
          >
            <MemberAvatar name={participant.name} uri={participant.avatarUrl} rankId={participant.rankId} size={36} />
            <Text flex={1} fontSize={14} fontWeight="$rowTitle" color="$neutralText" numberOfLines={1}>
              {participant.name}
            </Text>
            <ParticipantStatusIcon status={participant.status} />
          </XStack>
        </YStack>
      ))}
    </YStack>
  );
};
