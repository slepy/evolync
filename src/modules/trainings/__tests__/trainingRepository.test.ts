import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import type Training from "@/database/models/Training";
import { TrainingRepository } from "../repositories";
import { flush, record, resetDatabase, seedMember, seedRow, seedTraining } from "./testUtils";

const FROM = Date.UTC(2099, 0, 1);
const names = (list: Training[]) => list.map((t) => t.name).sort();

describe("TrainingRepository", () => {
  beforeEach(resetDatabase);

  it("school A's upcoming list covers all three visibilities, not school B", async () => {
    await seedMember("m-a", "school-a");
    await seedMember("m-b", "school-b");
    await seedTraining({ name: "org" });
    await seedTraining({ name: "school A", visibility: "school", school_id: "school-a" });
    await seedTraining({ name: "school B", visibility: "school", school_id: "school-b" });
    const privA = await seedTraining({ name: "private A", visibility: "whitelist" });
    const privB = await seedTraining({ name: "private B", visibility: "whitelist" });
    await seedRow("training_invitees", { training_id: privA, school_member_id: "m-a" });
    await seedRow("training_invitees", { training_id: privB, school_member_id: "m-b" });
    await seedTraining({ name: "other org", organization_id: "org-2" });
    await seedTraining({ name: "past", date: Date.UTC(2098, 11, 31) });
    await seedTraining({ name: "deleted", deleted_at: Date.now() });

    const list = record<Training[]>(TrainingRepository.observeUpcomingForSchool("school-a", "org-1", FROM));
    await flush();
    list.stop();
    assert.deepEqual(names(list.last()), ["org", "private A", "school A"]);
  });

  it("re-emits the school list when a school member gets invited", async () => {
    await seedMember("m-a", "school-a");
    const priv = await seedTraining({ name: "private", visibility: "whitelist" });

    const list = record<Training[]>(TrainingRepository.observeUpcomingForSchool("school-a", "org-1", FROM));
    await flush();
    assert.deepEqual(names(list.last()), []);

    await seedRow("training_invitees", { training_id: priv, school_member_id: "m-a" });
    await flush();
    list.stop();
    assert.deepEqual(names(list.last()), ["private"]);
  });

  it("organization list is sorted by day then time and reacts to status edits", async () => {
    await seedTraining({ name: "late", date: Date.UTC(2099, 0, 5), start_time: "19:00" });
    await seedTraining({ name: "early", date: Date.UTC(2099, 0, 5), start_time: "07:00" });
    const first = await seedTraining({ name: "first", date: Date.UTC(2099, 0, 2) });

    const list = record<Training[]>(TrainingRepository.observeUpcomingByOrganization("org-1", FROM));
    await flush();
    assert.deepEqual(list.last().map((t) => t.name), ["first", "early", "late"]);

    const emissions = list.values.length;
    const training = (await TrainingRepository.findById(first))!;
    await TrainingRepository.commit([TrainingRepository.prepareUpdate(training, { status: "cancelled" })]);
    await flush();
    list.stop();
    assert.ok(list.values.length > emissions, "a column edit re-emits the list");
    assert.equal(list.last()[0].status, "cancelled");
  });
});
