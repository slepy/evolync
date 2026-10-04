import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { contextColors, moduleAccents, neutral } from "@/core/theme/tokens";

const HEX = /^#[0-9A-F]{6}$/;
const FILL_16 = /^rgba\(\d{1,3},\d{1,3},\d{1,3},0\.16\)$/;

function rgbOf(hex: string) {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(",");
}

describe("module accents", () => {
  it("gives every module its own tint (one module, one color)", () => {
    const tints = Object.values(moduleAccents).map((a) => a.tint);
    assert.equal(new Set(tints).size, tints.length);
  });

  it("uses uppercase hex for solid values and a 16% fill", () => {
    for (const [module, accent] of Object.entries(moduleAccents)) {
      for (const value of [accent.tint, accent.from, accent.to, accent.buttonText]) {
        assert.match(value, HEX, `${module}: ${value}`);
      }
      assert.match(accent.fill, FILL_16, module);
    }
  });

  it("derives the fill from the tint (notebook uses the cyan base)", () => {
    for (const [module, accent] of Object.entries(moduleAccents)) {
      if (module === "notebook") continue;
      assert.equal(accent.fill, `rgba(${rgbOf(accent.tint)},0.16)`, module);
    }
  });

  it("never reuses a context label color as a module tint", () => {
    const tints = new Set(Object.values(moduleAccents).map((a) => a.tint));
    for (const context of Object.values(contextColors)) {
      assert.ok(!tints.has(context.label), context.label);
    }
  });
});

describe("context colors", () => {
  it("defines three-stop header gradients from 0 to 1", () => {
    for (const context of Object.values(contextColors)) {
      assert.equal(context.gradient.length, 3);
      assert.equal(context.gradient[0].at, 0);
      assert.equal(context.gradient[2].at, 1);
    }
  });
});

describe("neutrals", () => {
  it("keeps the page darker than the card", () => {
    assert.ok(parseInt(neutral.page.slice(1), 16) < parseInt(neutral.card.slice(1), 16));
  });
});
