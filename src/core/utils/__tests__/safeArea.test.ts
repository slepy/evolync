import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { bottomInsetPadding, SYSTEM_BAR_GAP } from "../safeArea";

describe("bottomInsetPadding", () => {
  it("keeps the designed padding without a system bar", () => {
    assert.equal(bottomInsetPadding(36, 0), 36);
  });

  it("keeps the designed padding when the bar is short (gesture navigation)", () => {
    assert.equal(bottomInsetPadding(36, 16), 36);
  });

  it("lifts the content above the 3-button navigation bar", () => {
    assert.equal(bottomInsetPadding(36, 48), 48 + SYSTEM_BAR_GAP);
    assert.equal(bottomInsetPadding(28, 48), 64);
  });

  it("clears the iOS home indicator", () => {
    assert.equal(bottomInsetPadding(36, 34), 50);
  });

  it("ignores negative or invalid insets", () => {
    assert.equal(bottomInsetPadding(32, -10), 32);
    assert.equal(bottomInsetPadding(32, Number.NaN), 32);
  });
});
