import "./stubSync";
import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { database } from "@/database";
import { Q } from "@nozbe/watermelondb";
import type Training from "@/database/models/Training";
import type TrainingInvitee from "@/database/models/TrainingInvitee";
import type TrainingSeries from "@/database/models/TrainingSeries";
import { timestampToDay } from "../types/helpers";
import type { SeriesRule, Weekday } from "../types/dto";
import { resetDatabase, seedTraining } from "./testUtils";
import { syncCalls } from "./stubSync";

// Required after the sync stub is installed.
const service = require("../services/trainingService") as typeof import("../services/trainingService");

const base = { organizationId: "org-1", createdBy: "owner", name: "Kids" };
// 2099-01-05 is a Monday.
const weekly = (weekday: Weekday): SeriesRule => ({ weekday, frequency: "weekly", startTime: "17:00", endTime: "18:00" });

const live = async <T>(table: string, ...clauses: any[]) =>
  database.get(table).query(Q.where("deleted_at", null), ...clauses).fetch() as Promise<T[]>;
const days = (list: Training[]) => list.map((t) => timestampToDay(t.date)).sort();

describe("trainingService", () => {
  beforeEach(resetDatabase);

  it("a series with 2 weekly rules over 4 weeks writes 8 trainings and their invitees", async () => {
    const before = syncCalls.length;
    const { series, trainings } = await service.createTrainingSeries({
      ...base,
      visibility: "whitelist",
      inviteeIds: ["m1", "m2", "m1"],
      startDate: "2099-01-05",
      endDate: "2099-02-01",
      rules: [weekly(1), weekly(4)],
    });
    assert.equal(trainings.length, 8);
    assert.equal((await live<Training>("trainings", Q.where("series_id", series.id))).length, 8);
    assert.equal((await live<TrainingInvitee>("training_invitees")).length, 16, "2 unique invitees × 8");
    assert.deepEqual(JSON.parse(series.inviteeIds), ["m1", "m2"]);
    assert.equal(syncCalls.length, before + 1, "sync triggered once");
  });

  it("invalid input writes nothing", async () => {
    await assert.rejects(
      service.createTrainingSeries({ ...base, visibility: "whitelist", inviteeIds: [], startDate: "2099-01-05", endDate: "2099-02-01", rules: [weekly(1)] }),
      /eventValidationWhitelistRequired/,
    );
    await assert.rejects(
      service.createSingleTrainings({ ...base, visibility: "organization", dates: ["2000-01-01"], startTime: "17:00", endTime: "18:00" }),
      /trainingsValidationPastDate/,
    );
    await assert.rejects(
      service.createTrainingSeries({ ...base, visibility: "organization", startDate: "2099-01-05", endDate: "2099-12-01", rules: [weekly(1)] }),
      /trainingsValidationSeriesTooLong/,
    );
    assert.equal((await live("trainings")).length, 0);
    assert.equal((await live("training_series")).length, 0);
  });

  it("single mode writes one training per chosen day, dropping the school for org visibility", async () => {
    const trainings = await service.createSingleTrainings({
      ...base,
      visibility: "organization",
      schoolId: "school-a",
      dates: ["2099-01-10", "2099-01-03", "2099-01-17"],
      startTime: "10:00",
      endTime: "11:30",
      location: "  Hall B  ",
    });
    assert.deepEqual(days(trainings), ["2099-01-03", "2099-01-10", "2099-01-17"]);
    assert.ok(trainings.every((t) => t.schoolId === undefined || t.schoolId === null));
    assert.equal(trainings[0].location, "Hall B");
    assert.equal(trainings[0].seriesId ?? null, null);
  });

  it("'this and following' edit replaces only trainings from the selected day on", async () => {
    const { series, trainings } = await service.createTrainingSeries({
      ...base, visibility: "organization", startDate: "2099-01-05", endDate: "2099-02-01", rules: [weekly(1)],
    });
    const third = trainings.find((t) => timestampToDay(t.date) === "2099-01-19")!;

    const next = await service.updateSeriesFrom(third.id, {
      ...base, name: "Kids (new time)", visibility: "organization",
      startDate: "2099-01-19", endDate: "2099-02-01", rules: [{ ...weekly(1), startTime: "16:00" }],
    });

    const old = await live<Training>("trainings", Q.where("series_id", series.id));
    assert.deepEqual(days(old), ["2099-01-05", "2099-01-12"], "earlier trainings untouched");
    assert.ok(old.every((t) => t.startTime === "17:00" && t.name === "Kids"));
    const replaced = await live<Training>("trainings", Q.where("series_id", next.id));
    assert.deepEqual(days(replaced), ["2099-01-19", "2099-01-26"]);
    assert.ok(replaced.every((t) => t.startTime === "16:00"));
    const oldSeries = await database.get<TrainingSeries>("training_series").find(series.id);
    assert.equal(timestampToDay(oldSeries.endDate), "2099-01-18");
  });

  it("'this and following' from the first occurrence removes the old series", async () => {
    const { series, trainings } = await service.createTrainingSeries({
      ...base, visibility: "organization", startDate: "2099-01-05", endDate: "2099-01-20", rules: [weekly(1)],
    });
    await service.deleteSeriesFrom(trainings[0].id);
    assert.equal((await live("trainings")).length, 0);
    const oldSeries = await database.get<TrainingSeries>("training_series").find(series.id);
    assert.ok(oldSeries.deletedAt);
  });

  it("delete from a later occurrence keeps earlier ones and ends the series", async () => {
    const { series, trainings } = await service.createTrainingSeries({
      ...base, visibility: "whitelist", inviteeIds: ["m1"], startDate: "2099-01-05", endDate: "2099-02-01", rules: [weekly(1)],
    });
    await service.deleteSeriesFrom(trainings[2].id);
    assert.deepEqual(days(await live<Training>("trainings")), ["2099-01-05", "2099-01-12"]);
    assert.equal((await live("training_invitees")).length, 2);
    const s = await database.get<TrainingSeries>("training_series").find(series.id);
    assert.equal(timestampToDay(s.endDate), "2099-01-18");
  });

  it("'this training only' edit updates one training and reconciles invitees", async () => {
    const { trainings } = await service.createTrainingSeries({
      ...base, visibility: "whitelist", inviteeIds: ["m1", "m2"], startDate: "2099-01-05", endDate: "2099-01-20", rules: [weekly(1)],
    });
    await service.updateTraining(trainings[1].id, { startTime: "19:00", endTime: "20:00", inviteeIds: ["m2", "m3"] });

    const edited = await database.get<Training>("trainings").find(trainings[1].id);
    assert.equal(edited.startTime, "19:00");
    assert.ok(edited.seriesId, "still part of the series");
    const invitees = await live<TrainingInvitee>("training_invitees", Q.where("training_id", trainings[1].id));
    assert.deepEqual(invitees.map((i) => i.schoolMemberId).sort(), ["m2", "m3"]);
    const untouched = await database.get<Training>("trainings").find(trainings[0].id);
    assert.equal(untouched.startTime, "17:00");

    await service.updateTraining(trainings[1].id, { visibility: "organization" });
    assert.equal((await live("training_invitees", Q.where("training_id", trainings[1].id))).length, 0);
  });

  it("extends within the window, and continues with a new series beyond it", async () => {
    const { series } = await service.createTrainingSeries({
      ...base, visibility: "organization", startDate: "2099-01-05", endDate: "2099-01-31", rules: [weekly(1)],
    });
    const added = await service.extendSeries(series.id, "2099-02-28");
    assert.deepEqual(days(added), ["2099-02-02", "2099-02-09", "2099-02-16", "2099-02-23"]);
    const extended = await database.get<TrainingSeries>("training_series").find(series.id);
    assert.equal(timestampToDay(extended.endDate), "2099-02-28");

    // Window of the original series ends 2099-07-05; going further starts a continuation.
    const more = await service.extendSeries(series.id, "2099-08-10");
    assert.ok(more.every((t) => t.seriesId !== series.id));
    assert.equal(days(more)[0], "2099-03-02");
    assert.equal(days(more).at(-1), "2099-08-10");
    await assert.rejects(service.extendSeries(series.id, "2099-02-20"), /trainingsValidationExtendAfterEnd/);
  });

  it("cancel/restore, and past trainings are read-only", async () => {
    const [training] = await service.createSingleTrainings({
      ...base, visibility: "organization", dates: ["2099-01-03"], startTime: "10:00", endTime: "11:00",
    });
    await service.setTrainingStatus(training.id, "cancelled");
    assert.equal((await database.get<Training>("trainings").find(training.id)).status, "cancelled");
    await service.setTrainingStatus(training.id, "active");
    assert.equal((await database.get<Training>("trainings").find(training.id)).status, "active");

    const past = await seedTraining({ date: Date.UTC(2020, 0, 1) });
    await assert.rejects(service.setTrainingStatus(past, "cancelled"), /trainingsErrorPastReadOnly/);
    await assert.rejects(service.deleteTraining(past), /trainingsErrorPastReadOnly/);
    await assert.rejects(service.updateTraining(past, { name: "x" }), /trainingsErrorPastReadOnly/);

    await service.deleteTraining(training.id);
    assert.equal((await live("trainings", Q.where("id", training.id))).length, 0);
  });
});
