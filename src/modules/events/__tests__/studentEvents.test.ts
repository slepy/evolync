import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { EventParticipantStatus } from "@/database/models/EventParticipant";
import {
  canStudentAnswer,
  countByParticipantStatus,
  filterStudentEvents,
  isPastEvent,
} from "../components/studentEvents";

const TODAY = "2099-03-10";
const day = (value: string) => new Date(`${value}T00:00:00.000Z`);
const item = (endDay: string, participantStatus: EventParticipantStatus = "attending") => ({
  event: { endDate: day(endDay) },
  participantStatus,
});

describe("isPastEvent", () => {
  it("keeps an event ending today upcoming", () => {
    assert.equal(isPastEvent({ endDate: day(TODAY) }, TODAY), false);
    assert.equal(isPastEvent({ endDate: day("2099-03-09") }, TODAY), true);
  });
});

describe("filterStudentEvents", () => {
  const items = [item("2099-03-20"), item("2099-03-10"), item("2099-03-01")];

  it("splits upcoming and past, in the given order", () => {
    assert.deepEqual(
      filterStudentEvents(items, "upcoming", TODAY).map((i) => i.event.endDate),
      [day("2099-03-20"), day("2099-03-10")],
    );
    assert.deepEqual(filterStudentEvents(items, "past", TODAY).map((i) => i.event.endDate), [day("2099-03-01")]);
  });
});

describe("countByParticipantStatus", () => {
  it("counts every status, zero when missing", () => {
    assert.deepEqual(countByParticipantStatus([item(TODAY, "paid"), item(TODAY, "absent"), item(TODAY, "absent")]), {
      paid: 1,
      attending: 0,
      absent: 2,
    });
  });
});

describe("canStudentAnswer", () => {
  const upcoming = { endDate: day("2099-03-12"), cancelled: false };

  it("lets the student answer an upcoming event", () => {
    assert.equal(canStudentAnswer("absent", upcoming, TODAY), true);
    assert.equal(canStudentAnswer("attending", upcoming, TODAY), true);
  });

  it("locks a paid participation, a cancelled and a finished event", () => {
    assert.equal(canStudentAnswer("paid", upcoming, TODAY), false);
    assert.equal(canStudentAnswer("attending", { ...upcoming, cancelled: true }, TODAY), false);
    assert.equal(canStudentAnswer("attending", { endDate: day("2099-03-09"), cancelled: false }, TODAY), false);
  });
});
