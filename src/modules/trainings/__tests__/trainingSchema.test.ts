import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildTrainingSchema } from "../validation/trainingSchema";

const TODAY = "2026-10-03";
const schema = buildTrainingSchema(() => TODAY);

const single = (overrides: Record<string, unknown> = {}) => ({
  mode: "single",
  name: "Sparring",
  visibility: "organization",
  dates: ["2026-10-03", "2026-10-10"],
  startTime: "18:00",
  endTime: "19:30",
  ...overrides,
});

const recurring = (overrides: Record<string, unknown> = {}) => ({
  mode: "recurring",
  name: "Kids",
  visibility: "organization",
  startDate: "2026-10-05",
  endDate: "2026-12-31",
  rules: [{ weekday: 1, frequency: "weekly", startTime: "17:00", endTime: "18:00" }],
  ...overrides,
});

const messages = (input: unknown) => {
  const result = schema.safeParse(input);
  return result.success ? [] : result.error.issues.map((i) => i.message);
};

describe("trainingSchema", () => {
  it("accepts valid single and recurring input (today counts as future)", () => {
    assert.deepEqual(messages(single()), []);
    assert.deepEqual(messages(recurring()), []);
  });

  it("rejects past days in both modes", () => {
    assert.ok(messages(single({ dates: ["2026-10-02"] })).includes("trainingsValidationPastDate"));
    assert.ok(messages(recurring({ startDate: "2026-10-01" })).includes("trainingsValidationPastDate"));
  });

  it("rejects duplicate and empty single dates", () => {
    assert.ok(messages(single({ dates: ["2026-10-10", "2026-10-10"] })).includes("trainingsValidationDuplicateDates"));
    assert.ok(messages(single({ dates: [] })).includes("trainingsValidationDatesRequired"));
  });

  it("requires end time after start time", () => {
    assert.ok(messages(single({ endTime: "18:00" })).includes("trainingsValidationEndTimeBeforeStart"));
    assert.ok(
      messages(recurring({ rules: [{ weekday: 1, frequency: "weekly", startTime: "18:00", endTime: "17:00" }] })).includes(
        "trainingsValidationEndTimeBeforeStart",
      ),
    );
    assert.ok(messages(single({ startTime: "25:00" })).includes("trainingsValidationInvalidTime"));
  });

  it("enforces the 6-month cap and date order", () => {
    assert.deepEqual(messages(recurring({ endDate: "2027-04-05" })), []);
    assert.ok(messages(recurring({ endDate: "2027-04-06" })).includes("trainingsValidationSeriesTooLong"));
    assert.ok(messages(recurring({ endDate: "2026-10-04" })).includes("trainingsValidationEndDateBeforeStart"));
  });

  it("requires rules, and weekOfMonth for monthly rules", () => {
    assert.ok(messages(recurring({ rules: [] })).includes("trainingsValidationRulesRequired"));
    assert.ok(
      messages(recurring({ rules: [{ weekday: 6, frequency: "monthly", startTime: "10:00", endTime: "11:00" }] })).includes(
        "trainingsValidationWeekOfMonthRequired",
      ),
    );
    assert.deepEqual(
      messages(recurring({ rules: [{ weekday: 6, frequency: "monthly", weekOfMonth: -1, startTime: "10:00", endTime: "11:00" }] })),
      [],
    );
  });

  it("applies the school and whitelist audience refinements", () => {
    assert.ok(messages(single({ visibility: "school" })).includes("eventValidationSchoolIdRequired"));
    assert.deepEqual(messages(single({ visibility: "school", schoolId: "s1" })), []);
    assert.ok(messages(recurring({ visibility: "whitelist", inviteeIds: [] })).includes("eventValidationWhitelistRequired"));
    assert.deepEqual(messages(recurring({ visibility: "whitelist", inviteeIds: ["m1"] })), []);
  });

  it("requires a short name", () => {
    assert.ok(messages(single({ name: "  " })).includes("trainingsValidationNameRequired"));
    assert.ok(messages(single({ name: "x".repeat(61) })).includes("trainingsValidationNameTooLong"));
  });
});
