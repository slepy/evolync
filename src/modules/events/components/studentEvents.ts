import {
  EVENT_PARTICIPANT_STATUS,
  type EventParticipantStatus,
} from "@/database/models/EventParticipant";
import { timestampToDay } from "@/modules/trainings/types/helpers";

/** What the student's events list needs from an event and their participation. */
export interface StudentEventItem {
  event: { endDate: Date };
  participantStatus: EventParticipantStatus;
}

/** The event's last day ("YYYY-MM-DD") is before `today`. */
export const isPastEvent = (event: { endDate: Date }, today: string): boolean =>
  timestampToDay(event.endDate) < today;

/** Upcoming (ends today or later) or past events of the student, in the hook's order. */
export const filterStudentEvents = <T extends StudentEventItem>(
  items: T[],
  view: "upcoming" | "past",
  today: string,
): T[] => items.filter((item) => isPastEvent(item.event, today) === (view === "past"));

/** Paid / Attending / Absent counts for the Status summary. */
export const countByParticipantStatus = (
  items: StudentEventItem[],
): Record<EventParticipantStatus, number> => {
  const counts: Record<EventParticipantStatus, number> = {
    [EVENT_PARTICIPANT_STATUS.PAID]: 0,
    [EVENT_PARTICIPANT_STATUS.ATTENDING]: 0,
    [EVENT_PARTICIPANT_STATUS.ABSENT]: 0,
  };
  for (const item of items) counts[item.participantStatus] += 1;
  return counts;
};

/**
 * The student answers Attending / Absent themselves; Paid is set by the
 * instructor and locks the answer. A cancelled or finished event is
 * read-only too.
 */
export const canStudentAnswer = (
  status: EventParticipantStatus,
  event: { endDate: Date; cancelled: boolean },
  today: string,
): boolean => status !== EVENT_PARTICIPANT_STATUS.PAID && !event.cancelled && !isPastEvent(event, today);
