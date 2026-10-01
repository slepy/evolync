import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { shouldRegisterForPush, shouldShowPushRationale, toPushLocale } from "../utils/push";

describe("toPushLocale", () => {
  it("maps Polish variants to pl and everything else to en", () => {
    assert.equal(toPushLocale("pl"), "pl");
    assert.equal(toPushLocale("pl-PL"), "pl");
    assert.equal(toPushLocale("en-US"), "en");
    assert.equal(toPushLocale("de"), "en");
    assert.equal(toPushLocale(undefined), "en");
  });
});

describe("shouldRegisterForPush", () => {
  it("registers only with OS permission and without an opt-out", () => {
    assert.equal(shouldRegisterForPush(null, "granted"), true, "default is on");
    assert.equal(shouldRegisterForPush(true, "granted"), true);
    assert.equal(shouldRegisterForPush(false, "granted"), false, "Settings switch off wins");
    assert.equal(shouldRegisterForPush(true, "denied"), false);
    assert.equal(shouldRegisterForPush(null, "undetermined"), false, "never prompts implicitly");
  });
});

describe("shouldShowPushRationale", () => {
  it("shows once, before the OS prompt, unless the user opted out", () => {
    assert.equal(shouldShowPushRationale(null, "undetermined", false), true);
    assert.equal(shouldShowPushRationale(null, "undetermined", true), false, "dismissed");
    assert.equal(shouldShowPushRationale(false, "undetermined", false), false, "opted out");
    assert.equal(shouldShowPushRationale(null, "granted", false), false, "already decided");
    assert.equal(shouldShowPushRationale(null, "denied", false), false, "already decided");
  });
});

import { isPushRegistrationStale, PUSH_REREGISTER_INTERVAL_MS } from "../utils/push";

describe("isPushRegistrationStale", () => {
  const now = 1_000_000_000;
  it("re-registers when never registered, stale, or the language changed", () => {
    assert.equal(isPushRegistrationStale(null, "en", now), true);
    assert.equal(isPushRegistrationStale({ at: now - 60_000, locale: "en" }, "en", now), false, "fresh");
    assert.equal(isPushRegistrationStale({ at: now - 60_000, locale: "en" }, "pl", now), true, "language changed");
    assert.equal(
      isPushRegistrationStale({ at: now - PUSH_REREGISTER_INTERVAL_MS, locale: "en" }, "en", now),
      true,
      "stale",
    );
  });
});
