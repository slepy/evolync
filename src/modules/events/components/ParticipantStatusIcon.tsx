import { withAlpha } from "@/core/components";
import type { EventParticipantStatus } from "@/database/models/EventParticipant";
import { XStack } from "tamagui";
import { PARTICIPANT_STATUS_STYLE } from "../constants";

export interface ParticipantStatusIconProps {
  status: EventParticipantStatus;
}

/** Read-only 32px status circle of a participant (Paid wallet, Attending check, Absent x). */
export function ParticipantStatusIcon({ status }: ParticipantStatusIconProps) {
  const { icon: Icon, tint, label } = PARTICIPANT_STATUS_STYLE[status];
  return (
    <XStack
      role="img"
      aria-label={t(label)}
      width={32}
      height={32}
      borderRadius={16}
      backgroundColor={withAlpha(tint, 0.16)}
      alignItems="center"
      justifyContent="center"
      flexShrink={0}
    >
      <Icon size={15} color={tint} strokeWidth={2.6} />
    </XStack>
  );
}
