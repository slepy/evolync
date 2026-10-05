import { StatusSummary } from "@/core/components";
import React from "react";
import { PARTICIPANT_STATUS_STYLE, PARTICIPANT_SUMMARY_ORDER } from "../constants";
import type { ParticipantCounts } from "../hooks/useEventParticipants";

interface ParticipantSummaryProps {
  counts: ParticipantCounts;
  /** Details (10C): the whole card opens the participants list ("Manage ›"). */
  onManage?: () => void;
}

/** Event participants as a Status summary (10C linked, 10D static): members, coming, Paid / Attending / Absent. */
export const ParticipantSummary: React.FC<ParticipantSummaryProps> = ({ counts, onManage }) => {
  const total = counts.paid + counts.attending + counts.absent;
  return (
    <StatusSummary
      title={t("eventsMembersCount", { count: total })}
      subtitle={t("eventsComingCount", { count: counts.paid + counts.attending })}
      accent="events"
      onPress={onManage}
      actionLabel={onManage ? t("eventsManage") : undefined}
      items={PARTICIPANT_SUMMARY_ORDER.map((status) => {
        const style = PARTICIPANT_STATUS_STYLE[status];
        return {
          key: status,
          count: counts[status],
          label: t(style.label),
          icon: style.icon,
          barColor: style.barColor,
          iconColor: style.tint,
        };
      })}
    />
  );
};
