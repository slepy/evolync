import { MemberAvatar } from "@/core/components";
import { moduleAccents } from "@/core/theme/tokens";
import React from "react";
import { ActivityIndicator } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { useEventParticipants } from "../hooks/useEventParticipants";
import { ParticipantStatusIcon } from "./ParticipantStatusIcon";

interface EventRowParticipantsProps {
  eventId: string;
}

/**
 * Participants of an expanded event row in the List view: avatar, name and
 * a read-only status icon each; statuses change on the Participants screen.
 */
export const EventRowParticipants: React.FC<EventRowParticipantsProps> = ({ eventId }) => {
  const { participantList, isLoading } = useEventParticipants(eventId);

  if (isLoading) return <ActivityIndicator color={moduleAccents.events.tint} />;

  if (participantList.length === 0) {
    return (
      <Text fontSize={13} fontWeight="$secondary" color="$neutralMuted">
        {t("emptyNoParticipants")}
      </Text>
    );
  }

  return (
    <YStack role="list" aria-label={t("eventsParticipants")} gap={8}>
      {participantList.map((item) => {
        const name = item.member.displayName || t("unknownMember");
        return (
          <XStack key={item.participant.id} role="listitem" alignItems="center" gap={12}>
            <MemberAvatar name={name} uri={item.member.avatarUrl} rankId={item.member.currentRankId} size={36} />
            <Text flex={1} fontSize={14} fontWeight="$rowTitle" color="$neutralText" numberOfLines={1}>
              {name}
            </Text>
            <ParticipantStatusIcon status={item.status} />
          </XStack>
        );
      })}
    </YStack>
  );
};
