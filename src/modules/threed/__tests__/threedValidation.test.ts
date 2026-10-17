import { describe, it } from "node:test";
import assert from "node:assert/strict";
import en from "@/core/i18n/locales/en.json";
import pl from "@/core/i18n/locales/pl.json";
import {
  createSequenceSchema,
  createTechniqueSchema,
  THREED_TITLE_MAX,
  validated,
} from "../validation/threedSchema";

const errorOf = (fn: () => unknown) => {
  try {
    fn();
    return null;
  } catch (err) {
    return (err as Error).message;
  }
};

describe("threed validation", () => {
  it("trims the title before checking it, so spaces alone are rejected", () => {
    assert.equal(validated(createSequenceSchema, { title: "  Guard pass " }).title, "Guard pass");
    assert.equal(errorOf(() => validated(createSequenceSchema, { title: "   " })), "threedValidationTitleRequired");
  });

  it("throws the translation key of the first problem", () => {
    assert.equal(
      errorOf(() => validated(createSequenceSchema, { title: "x".repeat(THREED_TITLE_MAX + 1) })),
      "threedValidationTitleTooLong",
    );
    assert.equal(
      errorOf(() => validated(createTechniqueSchema, { title: "Kimura", bodyPart: "tail", techniqueData: {} })),
      "threedValidationInvalidBodyPart",
    );
  });

  it("has the title keys in both locales", () => {
    for (const key of ["threedValidationTitleRequired", "threedValidationTitleTooLong", "threedValidationInvalidBodyPart"]) {
      assert.equal(typeof (en as Record<string, string>)[key], "string", `en: ${key}`);
      assert.equal(typeof (pl as Record<string, string>)[key], "string", `pl: ${key}`);
    }
  });
});
