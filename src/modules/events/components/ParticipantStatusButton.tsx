import { StatusButton, withAlpha } from "@/core/components";
import { PARTICIPANT_STATUS_STYLE } from "../constants";
import type { EventParticipantStatus } from "@/database/models/EventParticipant";

export interface ParticipantStatusButtonProps {
  status: EventParticipantStatus;
  disabled?: boolean;
  onPress: () => void;
}

/** Status button of a participant (Paid wallet, Attending check, Absent x); a tap moves to the next status. */
export function ParticipantStatusButton({
  status,
  disabled,
  onPress,
}: ParticipantStatusButtonProps) {
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
