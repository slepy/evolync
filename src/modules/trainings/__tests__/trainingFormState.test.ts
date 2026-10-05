import { describe, it } from "node:test";
import assert from "node:assert/strict";
import en from "@/core/i18n/locales/en.json";
import { TRAINING_VISIBILITY } from "@/database/models/Training";
import { TRAINING_MODE } from "../types/enums";
import {
  countOccurrences,
  hasTrainingChanges,
  initialTrainingForm,
  monthlyRuleSummary,
  nextRule,
  seriesRulesSummary,
  seriesToForm,
  setRuleFrequency,
  trainingToForm,
  validateTrainingForm,
} from "../components/trainingFormState";

// English texts with {{var}} interpolation (the global test `t` returns keys).
const translations = en as Record<string, string>;
(globalThis as { t?: unknown }).t = (key: string, vars: Record<string, unknown> = {}) =>
  (translations[key] ?? key).replace(/\{\{(\w+)\}\}/g, (_, name: string) => String(vars[name]));

const TODAY = "2099-03-02"; // Monday
const getToday = () => TODAY;

describe("initialTrainingForm", () => {
  it("starts on the calendar's day, recurring on that weekday", () => {
    const form = initialTrainingForm("2099-03-07", undefined, TODAY); // Saturday
    assert.equal(form.mode, TRAINING_MODE.SINGLE);
    assert.equal(form.date, "2099-03-07");
    assert.equal(form.startDate, "2099-03-07");
    assert.equal(form.endDate, "2099-06-07");
    assert.equal(form.rules[0].weekday, 6);
    assert.equal(form.visibility, TRAINING_VISIBILITY.ORGANIZATION);
  });

  it("falls back to today for past or bad days and targets the school", () => {
    const form = initialTrainingForm("2000-01-01", "school-a", TODAY);
    assert.equal(form.date, TODAY);
    assert.equal(form.visibility, TRAINING_VISIBILITY.SCHOOL);
    assert.equal(form.schoolId, "school-a");
    assert.equal(initialTrainingForm("nope", undefined, TODAY).date, TODAY);
  });
});

describe("validateTrainingForm", () => {
  it("returns single values with the one day", () => {
    const form = { ...initialTrainingForm("2099-03-04", undefined, TODAY), name: " Kata " };
    const result = validateTrainingForm(form, getToday);
    assert.ok(result.ok);
    if (result.ok && result.values.mode === TRAINING_MODE.SINGLE) {
      assert.deepEqual(result.values.dates, ["2099-03-04"]);
      assert.equal(result.values.name, "Kata");
    }
  });

  it("maps errors to the fields that show them", () => {
    const form = {
      ...initialTrainingForm(TODAY, undefined, TODAY),
      date: "2099-03-01",
      endTime: "17:00",
    };
    const result = validateTrainingForm(form, getToday);
    assert.ok(!result.ok);
    if (!result.ok) {
      assert.equal(result.errors.name, "trainingsValidationNameRequired");
      assert.equal(result.errors.date, "trainingsValidationPastDate");
      assert.equal(result.errors.endTime, "trainingsValidationEndTimeBeforeStart");
    }
  });

  it("keys rule errors by index and requires a school / members", () => {
    const base = initialTrainingForm(TODAY, undefined, TODAY);
    const form = {
      ...base,
      mode: TRAINING_MODE.RECURRING,
      name: "Judo",
      visibility: TRAINING_VISIBILITY.WHITELIST,
      rules: [base.rules[0], { ...base.rules[0], endTime: "10:00" }],
    };
    const result = validateTrainingForm(form, getToday);
    assert.ok(!result.ok);
    if (!result.ok) {
      assert.equal(result.errors["rules.1.endTime"], "trainingsValidationEndTimeBeforeStart");
      assert.equal(result.errors.inviteeIds, "eventValidationWhitelistRequired");
    }
  });
});

describe("hasTrainingChanges", () => {
  it("ignores fields of the other mode", () => {
    const initial = initialTrainingForm(TODAY, undefined, TODAY);
    assert.equal(hasTrainingChanges({ ...initial, endDate: "2099-04-01" }, initial), false);
    assert.equal(hasTrainingChanges({ ...initial, name: "x" }, initial), true);
  });
});

describe("series rules", () => {
  it("counts occurrences only for a valid draft", () => {
    const form = {
      ...initialTrainingForm(TODAY, undefined, TODAY),
      startDate: "2099-03-02",
      endDate: "2099-03-15",
    };
    assert.equal(countOccurrences(form), 2); // two Mondays
    assert.equal(countOccurrences({ ...form, endDate: "2099-03-01" }), null);
    assert.equal(countOccurrences({ ...form, endDate: "2099-12-31" }), null);
  });

  it("switches frequency and adds the next weekday", () => {
    const rule = initialTrainingForm(TODAY, undefined, TODAY).rules[0];
    const monthly = setRuleFrequency(rule, "monthly");
    assert.equal(monthly.weekOfMonth, 1);
    assert.equal("weekOfMonth" in setRuleFrequency(monthly, "weekly"), false);
    assert.equal(nextRule([{ ...rule, weekday: 6 }]).weekday, 0);
  });

  it("summarizes rules", () => {
    const rule = { weekday: 6 as const, frequency: "monthly" as const, weekOfMonth: 1 as const, startTime: "10:00", endTime: "12:00" };
    assert.equal(monthlyRuleSummary(rule), "Every 1st Saturday of the month");
    assert.equal(monthlyRuleSummary({ ...rule, frequency: "weekly" }), null);
    const weekly = (weekday: 0 | 1 | 3) => ({ weekday, frequency: "weekly" as const, startTime: "18:00", endTime: "19:30" });
    assert.equal(seriesRulesSummary([weekly(3), weekly(1), rule]), "Weekly Mon, Wed · Monthly 1st Sat");
    assert.equal(seriesRulesSummary([weekly(0), weekly(1)]), "Weekly Mon, Sun");
  });
});

describe("edit forms", () => {
  it("maps a training and a series", () => {
    const training = trainingToForm(
      {
        name: "Kids Judo",
        location: null,
        visibility: TRAINING_VISIBILITY.WHITELIST,
        schoolId: null,
        date: new Date("2099-03-04T00:00:00Z"),
        startTime: "18:00",
        endTime: "19:30",
      },
      ["m1"],
    );
    assert.equal(training.date, "2099-03-04");
    assert.deepEqual(training.inviteeIds, ["m1"]);
    assert.equal(training.location, "");

    const series = seriesToForm(
      {
        name: "Kids Judo",
        visibility: TRAINING_VISIBILITY.SCHOOL,
        schoolId: "s1",
        inviteeIds: "[]",
        endDate: new Date("2099-04-30T00:00:00Z"),
        rules: JSON.stringify([{ weekday: 1, frequency: "weekly", startTime: "18:00", endTime: "19:30" }]),
      },
      "2099-03-04",
    );
    assert.equal(series.mode, TRAINING_MODE.RECURRING);
    assert.equal(series.startDate, "2099-03-04");
    assert.equal(series.endDate, "2099-04-30");
    assert.equal(series.rules.length, 1);
  });
});
