import { moduleAccents, neutral } from "@/core/theme/tokens";
import { Check, Clock, X, type LucideIcon } from "lucide-react-native";
import {
  type EventParticipantStatus,
  EVENT_PARTICIPANT_STATUS,
} from "@/database/models/EventParticipant";

/**
 * Status cycle for participant status toggle
 * Instructors cycle through all statuses: absent -> attending -> paid -> absent
 */
export const PARTICIPANT_STATUS_CYCLE: EventParticipantStatus[] = [
  EVENT_PARTICIPANT_STATUS.ABSENT,
  EVENT_PARTICIPANT_STATUS.ATTENDING,
  EVENT_PARTICIPANT_STATUS.PAID,
];

/** The status a tap moves a participant to (10D). */
export const nextParticipantStatus = (status: EventParticipantStatus): EventParticipantStatus =>
  PARTICIPANT_STATUS_CYCLE[(PARTICIPANT_STATUS_CYCLE.indexOf(status) + 1) % PARTICIPANT_STATUS_CYCLE.length];

/** Icon, color and label key of a participant status (10C counters, 10D chips). */
export const PARTICIPANT_STATUS_STYLE: Record<
  EventParticipantStatus,
  { icon: LucideIcon; tint: string; label: string }
> = {
  [EVENT_PARTICIPANT_STATUS.ABSENT]: { icon: X, tint: neutral.tint, label: "statusAbsent" },
  [EVENT_PARTICIPANT_STATUS.ATTENDING]: { icon: Clock, tint: moduleAccents.events.from, label: "statusAttending" },
  [EVENT_PARTICIPANT_STATUS.PAID]: { icon: Check, tint: moduleAccents.payments.tint, label: "statusPaid" },
};
