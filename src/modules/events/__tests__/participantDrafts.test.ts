import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EVENT_PARTICIPANT_STATUS } from "@/database/models/EventParticipant";
import {
  countExamTakers,
  draftStatus,
  pruneStatusDrafts,
  withStatusDraft,
} from "../components/participantDrafts";

const { ABSENT, ATTENDING, PAID } = EVENT_PARTICIPANT_STATUS;

describe("participant status drafts", () => {
  it("shows the draft over the stored status", () => {
    const anna = { id: "p1", status: ABSENT };
    assert.equal(draftStatus(anna, {}), ABSENT);
    assert.equal(draftStatus(anna, { p1: PAID }), PAID);
  });

  it("drops a draft that returns to the stored status", () => {
    const anna = { id: "p1", status: ABSENT };
    const drafts = withStatusDraft({}, anna, ATTENDING);
    assert.deepEqual(drafts, { p1: ATTENDING });
    assert.deepEqual(withStatusDraft(drafts, anna, ABSENT), {});
  });

  it("keeps a draft status when Takes exam re-emits the row", () => {
    const drafts = { p1: PAID };
    const reEmitted = [
      { id: "p1", status: ABSENT, takesExam: true },
      { id: "p2", status: ATTENDING, takesExam: false },
    ];
    assert.deepEqual(pruneStatusDrafts(drafts, reEmitted), { p1: PAID });
    assert.equal(draftStatus(reEmitted[0], pruneStatusDrafts(drafts, reEmitted)), PAID);
  });

  it("forgets drafts of removed participants and drafts the database caught up with", () => {
    const drafts = { p1: PAID, p2: ATTENDING };
    assert.deepEqual(pruneStatusDrafts(drafts, [{ id: "p1", status: PAID }]), {});
  });

  it("counts the exam takers", () => {
    assert.equal(countExamTakers([{ takesExam: true }, { takesExam: false }, { takesExam: null }, {}]), 1);
  });
});
