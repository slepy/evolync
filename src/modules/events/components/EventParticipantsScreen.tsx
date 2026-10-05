import { ListAvatar, ListCard, ListRow, PrimaryButton, SubScreenPage, memberInitials, withAlpha } from "@/core/components";
import React from "react";
import { ActivityIndicator } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { nextParticipantStatus, PARTICIPANT_STATUS_STYLE } from "../constants";
import { useEvent } from "../hooks/useEvent";
import { useEventParticipants } from "../hooks/useEventParticipants";
import type { EventParticipantStatus } from "@/database/models/EventParticipant";
import { ParticipantCountsCard } from "./ParticipantCountsCard";

interface EventParticipantsScreenProps {
  eventId: string;
  /** After Save: back to the details. */
  onSaved: () => void;
}

/**
 * Participants (10D): the event name, Absent / Attending / Paid counters,
 * member rows whose status chip cycles on tap; Save appears after a change.
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
      <ParticipantCountsCard counts={counts} />
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
                leading={<ListAvatar initials={memberInitials(name)} />}
                trailing={
                  <StatusChip
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

/** 40px status pill in the status color; a tap moves to the next status. */
function StatusChip({
  status,
  disabled,
  onPress,
}: {
  status: EventParticipantStatus;
  disabled?: boolean;
  onPress: () => void;
}) {
  const { icon: Icon, tint, label } = PARTICIPANT_STATUS_STYLE[status];
  return (
    <XStack
      role="button"
      aria-label={t("eventsChangeStatus", { status: t(label) })}
      onPress={disabled ? undefined : onPress}
      pressStyle={{ opacity: 0.8 }}
      height={40}
      paddingLeft={11}
      paddingRight={14}
      borderRadius={20}
      backgroundColor={withAlpha(tint, 0.14)}
      alignItems="center"
      gap={6}
      flexShrink={0}
    >
      <Icon size={16} color={tint} strokeWidth={2.4} />
      <Text fontSize={13} fontWeight="$button" color={tint}>
        {t(label)}
      </Text>
    </XStack>
  );
}
