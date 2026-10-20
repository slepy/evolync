import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { enUS, hu, pl } from "date-fns/locale";
import { dateFnsLocale, intlLocaleTag } from "../localeTags";

describe("intlLocaleTag", () => {
  it("maps app languages to Intl tags, English by the caller's variant", () => {
    assert.equal(intlLocaleTag("pl"), "pl-PL");
    assert.equal(intlLocaleTag("hu"), "hu-HU");
    assert.equal(intlLocaleTag("hu-HU"), "hu-HU");
    assert.equal(intlLocaleTag("en"), "en-US");
    assert.equal(intlLocaleTag("en", "en-GB"), "en-GB");
    assert.equal(intlLocaleTag(undefined), "en-US");
  });
});

describe("dateFnsLocale", () => {
  it("returns the date-fns locale of the app language", () => {
    assert.equal(dateFnsLocale("pl"), pl);
    assert.equal(dateFnsLocale("hu"), hu);
    assert.equal(dateFnsLocale("de"), enUS);
  });
});
