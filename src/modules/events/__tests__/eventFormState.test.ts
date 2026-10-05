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

describe("initialEventForm", () => {
  it("starts and ends on the calendar's day, for the whole organization", () => {
    const form = initialEventForm("2099-03-07", TODAY);
    assert.equal(form.startDate, "2099-03-07");
    assert.equal(form.endDate, "2099-03-07");
    assert.equal(form.currency, "PLN");
    assert.equal(form.visibility, EVENT_VISIBILITY.ORGANIZATION);
  });

  it("falls back to today for past or bad days", () => {
    assert.equal(initialEventForm("2000-01-01", TODAY).startDate, TODAY);
    assert.equal(initialEventForm("nope", TODAY).startDate, TODAY);
    assert.equal(initialEventForm(undefined, TODAY).endDate, TODAY);
  });
});

describe("validateEventForm", () => {
  it("returns trimmed values; empty price means free", () => {
    const form = { ...initialEventForm("2099-03-07", TODAY), name: " Winter Camp ", shortNote: "  " };
    const result = validateEventForm(form);
    assert.ok(result.ok);
    if (result.ok) {
      assert.equal(result.values.name, "Winter Camp");
      assert.equal(result.values.shortNote, undefined);
      assert.equal(result.values.price, 0);
      assert.equal(result.values.whitelistedMemberIds, undefined);
    }
  });

  it("accepts a decimal comma in the price", () => {
    const result = validateEventForm({ ...initialEventForm(undefined, TODAY), name: "Camp", price: "12,50" });
    assert.ok(result.ok && result.values.price === 12.5);
  });

  it("maps errors to the fields that show them", () => {
    const form = {
      ...initialEventForm("2099-03-07", TODAY),
      endDate: "2099-03-06",
      price: "-1",
      visibility: EVENT_VISIBILITY.WHITELIST,
    };
    const result = validateEventForm(form);
    assert.ok(!result.ok);
    if (!result.ok) {
      assert.equal(result.errors.name, "eventValidationNameRequired");
      assert.equal(result.errors.price, "eventValidationPriceMustBePositive");
    }
    const audience = validateEventForm({ ...form, name: "Camp", price: "", endDate: form.startDate });
    assert.ok(!audience.ok && audience.errors.inviteeIds === "eventValidationWhitelistRequired");
    const dates = validateEventForm({ ...form, name: "Camp", price: "", inviteeIds: [MEMBER_A] });
    assert.ok(!dates.ok && dates.errors.endDate === "eventValidationEndDateBeforeStart");
  });

  it("asks for the school of a school event", () => {
    const form = { ...initialEventForm(undefined, TODAY), name: "Camp", visibility: EVENT_VISIBILITY.SCHOOL };
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

  it("sees only real changes (member order does not count)", () => {
    const initial = eventToForm(event, [MEMBER_A, MEMBER_B]);
    assert.equal(hasEventChanges({ ...initial, inviteeIds: [MEMBER_B, MEMBER_A] }, initial), false);
    assert.equal(hasEventChanges({ ...initial, name: "Winter Camp " }, initial), false);
    assert.equal(hasEventChanges({ ...initial, price: "900" }, initial), true);
    assert.equal(hasEventChanges({ ...initial, inviteeIds: [MEMBER_A] }, initial), true);
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
