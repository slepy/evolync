import type { EventParticipantStatus } from "@/database/models/EventParticipant";

/**
 * Pure merge of the participants screen (10D): rows come from the database,
 * statuses the owner changed but has not saved yet stay as drafts, so an
 * immediate write elsewhere on the screen (Takes exam) never resets them.
 */

export interface StoredParticipant {
  id: string;
  status: EventParticipantStatus;
  takesExam?: boolean | null;
}

/** Participant id → unsaved status. */
export type ParticipantStatusDrafts = Record<string, EventParticipantStatus>;

/** The status to show: the draft when there is one, else the stored one. */
export const draftStatus = (participant: StoredParticipant, drafts: ParticipantStatusDrafts): EventParticipantStatus =>
  drafts[participant.id] ?? participant.status;

/** Sets a draft; going back to the stored status drops it. */
export const withStatusDraft = (
  drafts: ParticipantStatusDrafts,
  participant: StoredParticipant,
  status: EventParticipantStatus,
): ParticipantStatusDrafts => {
  const next = { ...drafts };
  if (status === participant.status) delete next[participant.id];
  else next[participant.id] = status;
  return next;
};

/** Drops drafts of participants no longer listed and drafts that now match the stored status. */
export const pruneStatusDrafts = (
  drafts: ParticipantStatusDrafts,
  participants: StoredParticipant[],
): ParticipantStatusDrafts => {
  const next: ParticipantStatusDrafts = {};
  for (const p of participants) {
    const draft = drafts[p.id];
    if (draft !== undefined && draft !== p.status) next[p.id] = draft;
  }
  return next;
};

/** How many participants take the exam ("4 take the exam"). */
export const countExamTakers = (participants: Array<{ takesExam?: boolean | null }>): number =>
  participants.filter((p) => !!p.takesExam).length;
