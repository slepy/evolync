import { describe, it } from "node:test";
import assert from "node:assert/strict";
import en from "@/core/i18n/locales/en.json";
import pl from "@/core/i18n/locales/pl.json";
import { createNoteDocumentSchema, NOTE_TITLE_ERRORS, NOTE_TITLE_MAX } from "../validation";

const titleError = (title: string) => {
  const parsed = createNoteDocumentSchema.safeParse({ title });
  return parsed.success ? null : parsed.error.issues[0].message;
};

describe("note title validation", () => {
  it("trims the title", () => {
    const parsed = createNoteDocumentSchema.safeParse({ title: "  Armbar  " });
    assert.ok(parsed.success);
    assert.equal(parsed.data.title, "Armbar");
  });

  it("returns translation keys for an empty or too long title", () => {
    assert.equal(titleError("   "), "noteTitleRequired");
    assert.equal(titleError("x".repeat(NOTE_TITLE_MAX + 1)), "notesValidationTitleTooLong");
    assert.equal(titleError("x".repeat(NOTE_TITLE_MAX)), null);
  });

  it("lists only keys that exist in both locales", () => {
    for (const key of NOTE_TITLE_ERRORS) {
      assert.equal(typeof (en as Record<string, string>)[key], "string", `en: ${key}`);
      assert.equal(typeof (pl as Record<string, string>)[key], "string", `pl: ${key}`);
    }
  });
});
