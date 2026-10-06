import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { matchesSearch } from "@/core/components/SearchField/matchesSearch";

describe("matchesSearch", () => {
  it("matches everything for an empty query", () => {
    assert.equal(matchesSearch("  ", "Anna"), true);
  });

  it("ignores case and Polish diacritics", () => {
    assert.equal(matchesSearch("lukasz", "Łukasz Żółć"), true);
    assert.equal(matchesSearch("ZOLC", "Łukasz Żółć"), true);
  });

  it("checks every text and skips empty ones", () => {
    assert.equal(matchesSearch("gmail", "Anna", undefined, "anna@gmail.com"), true);
    assert.equal(matchesSearch("piotr", "Anna", null), false);
  });
});
