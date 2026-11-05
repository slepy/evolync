import React, { useMemo } from "react";
import { useEventParticipants } from "../hooks/useEventParticipants";
import type { EventRowParticipant } from "../types";
import { EventRowParticipantsView } from "./EventRowParticipantsView";

interface EventRowParticipantsProps {
  eventId: string;
  /** Opens the Participants screen of this event. */
  onManageParticipants: () => void;
}

/**
 * Connected participants of an expanded event row in the List view; a tap
 * on a participant opens the Participants screen.
 */
export const EventRowParticipants: React.FC<EventRowParticipantsProps> = ({ eventId, onManageParticipants }) => {
  const { participantList, isLoading } = useEventParticipants(eventId);
  const participants = useMemo<EventRowParticipant[]>(
    () =>
      participantList.map((item) => ({
        id: item.participant.id,
        name: item.member.displayName || t("unknownMember"),
        avatarUrl: item.member.avatarUrl,
        rankId: item.member.currentRankId,
        status: item.status,
      })),
    [participantList],
  );

  return (
    <EventRowParticipantsView
      participants={participants}
      isLoading={isLoading}
      onParticipantPress={onManageParticipants}
    />
  );
};
