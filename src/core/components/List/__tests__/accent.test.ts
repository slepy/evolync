import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveListAccent, withAlpha } from "@/core/components/List/accent";
import { contextColors, moduleAccents, neutral } from "@/core/theme/tokens";

describe("withAlpha", () => {
  it("turns a hex color into rgba", () => {
    assert.equal(withAlpha("#FB923C", 0.08), "rgba(251,146,60,0.08)");
  });
});

describe("resolveListAccent", () => {
  it("uses the module accent for a module key", () => {
    const a = resolveListAccent("students");
    assert.equal(a.tint, moduleAccents.students.tint);
    assert.equal(a.fill, moduleAccents.students.fill);
    assert.equal(a.from, moduleAccents.students.from);
    assert.equal(a.onGradient, moduleAccents.students.buttonText);
    assert.equal(a.selectedFill, "rgba(251,146,60,0.08)");
  });

  it("uses the context label and the gradient ends for a context key", () => {
    const a = resolveListAccent("organization");
    assert.equal(a.tint, contextColors.organization.label);
    assert.equal(a.fill, contextColors.organization.fill);
    assert.equal(a.from, "#FBBF24");
    assert.equal(a.to, "#D97706");
    assert.equal(a.onGradient, contextColors.organization.fg);
  });

  it("falls back to neutral chrome", () => {
    const a = resolveListAccent("neutral");
    assert.equal(a.tint, neutral.tint);
    assert.equal(a.fill, neutral.tintFill);
  });
});
