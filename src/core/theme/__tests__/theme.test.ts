import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveTheme } from "@/core/theme/resolve";

describe("resolveTheme", () => {
  it("follows the OS scheme", () => {
    assert.equal(resolveTheme("dark"), "dark");
    assert.equal(resolveTheme("light"), "light");
  });

  it("treats a null or unknown OS scheme as light", () => {
    assert.equal(resolveTheme(null), "light");
    assert.equal(resolveTheme(undefined), "light");
    assert.equal(resolveTheme("unspecified"), "light");
  });
});
