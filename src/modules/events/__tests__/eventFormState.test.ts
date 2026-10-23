import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EVENT_VISIBILITY } from "@/database/models/Event";
import {
  eventDayCount,
  eventToForm,
  hasEventChanges,
  initialEventForm,
  validateEventForm,
  withStartDate,
} from "../components/eventFormState";

const TODAY = "2099-03-02";
const SCHOOL = "8a6e0804-2bd0-4672-b79d-d97358ad76d1";
const MEMBER_A = "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed";
const MEMBER_B = "6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b";
const TYPE = "3f2b8c1e-5d4a-4e6f-9a7b-2c1d0e9f8a7b";

describe("initialEventForm", () => {
  it("starts and ends on the calendar's day, for the whole organization", () => {
    const form = initialEventForm("2099-03-07", TODAY);
    assert.equal(form.startDate, "2099-03-07");
    assert.equal(form.endDate, "2099-03-07");
    assert.equal(form.currency, "PLN");
    assert.equal(form.visibility, EVENT_VISIBILITY.ORGANIZATION);
    assert.equal(form.examsPlanned, false);
  });

  it("falls back to today for past or bad days", () => {
    assert.equal(initialEventForm("2000-01-01", TODAY).startDate, TODAY);
    assert.equal(initialEventForm("nope", TODAY).startDate, TODAY);
    assert.equal(initialEventForm(undefined, TODAY).endDate, TODAY);
  });
});

describe("validateEventForm", () => {
  it("returns trimmed values; empty price means free", () => {
    const form = { ...initialEventForm("2099-03-07", TODAY), name: " Winter Camp ", shortNote: "  ", typeId: TYPE };
    const result = validateEventForm(form);
    assert.ok(result.ok);
    if (result.ok) {
      assert.equal(result.values.name, "Winter Camp");
      assert.equal(result.values.shortNote, undefined);
      assert.equal(result.values.price, 0);
      assert.equal(result.values.whitelistedMemberIds, undefined);
      assert.equal(result.values.typeId, TYPE);
    }
  });

  it("asks for a type", () => {
    const result = validateEventForm({ ...initialEventForm("2099-03-07", TODAY), name: "Camp" });
    assert.ok(!result.ok && result.errors.typeId === "chooseType");
  });

  it("accepts a decimal comma in the price", () => {
    const result = validateEventForm({ ...initialEventForm(undefined, TODAY), name: "Camp", typeId: TYPE, price: "12,50" });
    assert.ok(result.ok && result.values.price === 12.5);
  });

  it("maps errors to the fields that show them", () => {
    const form = {
      ...initialEventForm("2099-03-07", TODAY),
      typeId: TYPE,
      endDate: "2099-03-06",
      price: "-1",
      visibility: EVENT_VISIBILITY.WHITELIST,
    };
    const result = validateEventForm(form);
    assert.ok(!result.ok);
    if (!result.ok) {
      assert.equal(result.errors.name, "nameRequired");
      assert.equal(result.errors.price, "eventValidationPriceMustBePositive");
    }
    const audience = validateEventForm({ ...form, name: "Camp", price: "", endDate: form.startDate });
    assert.ok(!audience.ok && audience.errors.inviteeIds === "eventValidationWhitelistRequired");
    const dates = validateEventForm({ ...form, name: "Camp", price: "", inviteeIds: [MEMBER_A] });
    assert.ok(!dates.ok && dates.errors.endDate === "eventValidationEndDateBeforeStart");
  });

  it("asks for the school of a school event", () => {
    const form = { ...initialEventForm(undefined, TODAY), name: "Camp", typeId: TYPE, visibility: EVENT_VISIBILITY.SCHOOL };
    const result = validateEventForm(form);
    assert.ok(!result.ok && result.errors.schoolId === "eventValidationSchoolIdRequired");
    assert.ok(validateEventForm({ ...form, schoolId: SCHOOL }).ok);
  });
});

describe("eventToForm / hasEventChanges", () => {
  const event = {
    name: "Winter Camp",
    shortNote: null,
    address: "Zakopane",
    startDate: new Date("2099-11-20"),
    endDate: new Date("2099-11-24"),
    price: 800,
    currency: "PLN",
    visibility: EVENT_VISIBILITY.WHITELIST,
    schoolId: null,
  };

  it("fills the form from the stored event", () => {
    const form = eventToForm(event, [MEMBER_A]);
    assert.equal(form.startDate, "2099-11-20");
    assert.equal(form.endDate, "2099-11-24");
    assert.equal(form.price, "800");
    assert.equal(form.shortNote, "");
    assert.deepEqual(form.inviteeIds, [MEMBER_A]);
  });

  it("an event saved before types asks for one, and picking it is a change", () => {
    const initial = eventToForm(event, [MEMBER_A]);
    assert.equal(initial.typeId, "");
    const result = validateEventForm(initial);
    assert.ok(!result.ok && result.errors.typeId === "chooseType");
    const typed = { ...initial, typeId: TYPE };
    assert.equal(hasEventChanges(typed, initial), true);
    assert.ok(validateEventForm(typed).ok);
  });

  it("keeps the stored type", () => {
    const form = eventToForm({ ...event, typeId: TYPE }, [MEMBER_A]);
    assert.equal(form.typeId, TYPE);
    assert.equal(hasEventChanges({ ...form, typeId: "" }, form), true);
  });

  it("sees only real changes (member order does not count)", () => {
    const initial = eventToForm(event, [MEMBER_A, MEMBER_B]);
    assert.equal(hasEventChanges({ ...initial, inviteeIds: [MEMBER_B, MEMBER_A] }, initial), false);
    assert.equal(hasEventChanges({ ...initial, name: "Winter Camp " }, initial), false);
    assert.equal(hasEventChanges({ ...initial, price: "900" }, initial), true);
    assert.equal(hasEventChanges({ ...initial, inviteeIds: [MEMBER_A] }, initial), true);
  });

  it("reads a missing Exams planned as off; switching it is a change that validates", () => {
    const initial = eventToForm({ ...event, typeId: TYPE }, [MEMBER_A]);
    assert.equal(initial.examsPlanned, false);
    assert.equal(eventToForm({ ...event, examsPlanned: true }).examsPlanned, true);
    const on = { ...initial, examsPlanned: true };
    assert.equal(hasEventChanges(on, initial), true);
    const result = validateEventForm(on);
    assert.ok(result.ok && result.values.examsPlanned === true);
  });
});

describe("eventDayCount / withStartDate", () => {
  it("counts both ends", () => {
    assert.equal(eventDayCount("2099-11-20", "2099-11-24"), 5);
    assert.equal(eventDayCount("2099-11-22", "2099-11-22"), 1);
    assert.equal(eventDayCount("2099-03-28", "2099-04-02"), 6);
    assert.equal(eventDayCount("2099-11-24", "2099-11-20"), null);
  });

  it("moves the end along when the start passes it", () => {
    const form = { ...initialEventForm("2099-03-07", TODAY), endDate: "2099-03-09" };
    assert.equal(withStartDate(form, "2099-03-08").endDate, "2099-03-09");
    assert.equal(withStartDate(form, "2099-03-12").endDate, "2099-03-12");
  });
});
