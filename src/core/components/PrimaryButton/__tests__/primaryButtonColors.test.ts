import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolvePrimaryButtonColors } from "@/core/components/PrimaryButton/primaryButtonColors";
import { contextColors, moduleAccents } from "@/core/theme/tokens";

describe("resolvePrimaryButtonColors", () => {
  it("uses the module button gradient and text", () => {
    assert.deepEqual(resolvePrimaryButtonColors("tags"), {
      from: moduleAccents.tags.from,
      to: moduleAccents.tags.to,
      text: moduleAccents.tags.buttonText,
    });
  });

  it("uses dark text on light accents", () => {
    assert.equal(resolvePrimaryButtonColors("trainings").text, moduleAccents.trainings.buttonText);
  });

  it("uses the context gradient ends for a context", () => {
    const c = resolvePrimaryButtonColors("school");
    assert.equal(c.from, contextColors.school.gradient[0].color);
    assert.equal(c.to, contextColors.school.gradient[2].color);
    assert.equal(c.text, contextColors.school.fg);
  });

  it("lets explicit colors override the accent field by field", () => {
    const c = resolvePrimaryButtonColors("tags", { text: "#000000" });
    assert.equal(c.from, moduleAccents.tags.from);
    assert.equal(c.text, "#000000");
  });
});
