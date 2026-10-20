import { ListCard, ListRow, MemberAvatar, PrimaryButton, StatusButton, SubScreenPage, withAlpha } from "@/core/components";
import React from "react";
import { ActivityIndicator } from "react-native";
import { Text, YStack } from "tamagui";
import { nextParticipantStatus, PARTICIPANT_STATUS_STYLE } from "../constants";
import { useEvent } from "../hooks/useEvent";
import { useEventParticipants } from "../hooks/useEventParticipants";
import type { EventParticipantStatus } from "@/database/models/EventParticipant";
import { ParticipantSummary } from "./ParticipantSummary";

interface EventParticipantsScreenProps {
  eventId: string;
  /** After Save: back to the details. */
  onSaved: () => void;
}

/**
 * Participants (10D): the event name, the static Status summary, member
 * rows whose round status button cycles on tap; Save appears after a change.
 */
export const EventParticipantsScreen: React.FC<EventParticipantsScreenProps> = ({ eventId, onSaved }) => {
  const { event } = useEvent(eventId);
  const { participantList, counts, isLoading, isSaving, error, toggleStatus, saveAll } = useEventParticipants(eventId);
  const changed = participantList.some((item) => item.status !== item.participant.status);

  const handleSave = async () => {
    try {
      await saveAll();
      onSaved();
    } catch {
      // The hook keeps the error, shown above the button.
    }
  };

  return (
    <SubScreenPage
      title={t("eventsParticipants")}
      footer={
        changed ? (
          <YStack gap={10}>
            {error ? (
              <Text fontSize={12.5} fontWeight="$secondary" color="$trashText" textAlign="center">
                {error}
              </Text>
            ) : null}
            <PrimaryButton label={t("save")} accent="events" onPress={handleSave} loading={isSaving} />
          </YStack>
        ) : undefined
      }
    >
      {event ? (
        <Text fontSize="$section" fontWeight="$section" color="$neutralText">
          {event.name}
        </Text>
      ) : null}
      <ParticipantSummary counts={counts} />
      <Text fontSize={13} fontWeight="$secondary" color="$neutralMuted">
        {t("eventsStatusHint")}
      </Text>
      {isLoading ? (
        <ActivityIndicator />
      ) : participantList.length === 0 ? (
        <YStack gap={4} alignItems="center" paddingVertical={24}>
          <Text fontSize={15} fontWeight="$rowTitle" color="$neutralText" textAlign="center">
            {t("emptyNoParticipants")}
          </Text>
          <Text fontSize={13} fontWeight="$secondary" color="$neutralMuted" textAlign="center">
            {t("emptyNoParticipantsHint")}
          </Text>
        </YStack>
      ) : (
        <ListCard>
          {participantList.map((item) => {
            const name = item.member.displayName || t("unknownMember");
            return (
              <ListRow
                key={item.participant.id}
                size="md"
                title={name}
                subtitle={item.member.email}
                leading={<MemberAvatar name={name} uri={item.member.avatarUrl} rankId={item.member.currentRankId} />}
                trailing={
                  <ParticipantStatusButton
                    status={item.status}
                    disabled={isSaving}
                    onPress={() => toggleStatus(item.participant.id, nextParticipantStatus(item.status))}
                  />
                }
              />
            );
          })}
        </ListCard>
      )}
    </SubScreenPage>
  );
};

/** Status button of a participant (Paid wallet, Attending check, Absent x); a tap moves to the next status. */
function ParticipantStatusButton({
  status,
  disabled,
  onPress,
}: {
  status: EventParticipantStatus;
  disabled?: boolean;
  onPress: () => void;
}) {
  const { icon, tint, label } = PARTICIPANT_STATUS_STYLE[status];
  return (
    <StatusButton
      icon={icon}
      color={{ tint, fill: withAlpha(tint, 0.16) }}
      label={t("statusChangeNow", { status: t(label) })}
      disabled={disabled}
      onPress={onPress}
    />
  );
}
