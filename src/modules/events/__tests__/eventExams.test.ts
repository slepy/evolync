import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { database } from "@/database";
import type EventParticipant from "@/database/models/EventParticipant";

// Network modules the service imports, replaced before it is required.
const stub = (request: string, exports: unknown) => {
  const resolved = require.resolve(request);
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports } as any;
};
let syncs = 0;
stub("@/database/sync", {
  sync: async () => {
    syncs += 1;
    return { success: true, timestamp: Date.now() };
  },
});
stub("@/config/supabase", { supabase: {} });

const service = require("../services/eventService") as typeof import("../services/eventService");

const DAY = "2099-06-12";

describe("event exams", () => {
  it("stores Exams planned on create and update; a missing value reads as off", async () => {
    const base = {
      organizationId: "org-1",
      name: "Summer grading",
      startDate: DAY,
      endDate: DAY,
      price: 0,
      currency: "PLN",
      visibility: "organization" as const,
      createdBy: "owner",
    };
    const plain = await service.createEvent(base);
    assert.equal(!!plain.examsPlanned, false);

    const exam = await service.createEvent({ ...base, examsPlanned: true });
    assert.equal(exam.examsPlanned, true);

    const off = await service.updateEvent(exam.id, { examsPlanned: false });
    assert.equal(off.examsPlanned, false);
  });

  it("stores Takes exam right away, keeps the status and syncs", async () => {
    const event = await service.createEvent({
      organizationId: "org-1",
      name: "Kyu exam",
      startDate: DAY,
      endDate: DAY,
      price: 0,
      currency: "PLN",
      visibility: "organization",
      createdBy: "owner",
      examsPlanned: true,
    });
    const [participant] = await service.addParticipantsToEvent(event.id, ["member-1"]);
    const before = syncs;

    await service.setParticipantTakesExam(participant.id, true);

    const stored = await database.get<EventParticipant>("event_participants").find(participant.id);
    assert.equal(stored.takesExam, true);
    assert.equal(stored.status, "absent");
    assert.equal(syncs, before + 1);
  });
});
