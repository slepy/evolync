import { moduleAccents, neutral } from "@/core/theme/tokens";
import { Check, Wallet, X, type LucideIcon } from "lucide-react-native";
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

/** Order of statuses in the Status summary (board S §6): Paid, Attending, Absent. */
export const PARTICIPANT_SUMMARY_ORDER: EventParticipantStatus[] = [
  EVENT_PARTICIPANT_STATUS.PAID,
  EVENT_PARTICIPANT_STATUS.ATTENDING,
  EVENT_PARTICIPANT_STATUS.ABSENT,
];

/**
 * Icon, colors and label key of a participant status (10C / 10D summary,
 * 10D status buttons): Paid wallet, Attending check, Absent x. Absent's bar
 * segment is darker than its icon, for contrast.
 */
export const PARTICIPANT_STATUS_STYLE: Record<
  EventParticipantStatus,
  { icon: LucideIcon; tint: string; barColor: string; label: string }
> = {
  [EVENT_PARTICIPANT_STATUS.ABSENT]: { icon: X, tint: neutral.tint, barColor: neutral.control, label: "statusAbsent" },
  [EVENT_PARTICIPANT_STATUS.ATTENDING]: {
    icon: Check,
    tint: moduleAccents.events.from,
    barColor: moduleAccents.events.from,
    label: "statusAttending",
  },
  [EVENT_PARTICIPANT_STATUS.PAID]: {
    icon: Wallet,
    tint: moduleAccents.payments.tint,
    barColor: moduleAccents.payments.tint,
    label: "statusPaid",
  },
};
