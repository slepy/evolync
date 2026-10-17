import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { database } from "@/database";
import en from "@/core/i18n/locales/en.json";
import pl from "@/core/i18n/locales/pl.json";
import { isTagNameTaken, TAG_NAME_MAX, tagSchema } from "../validation/tagSchema";

// Network modules the service imports, replaced before it is required.
const stub = (request: string, exports: unknown) => {
  const resolved = require.resolve(request);
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports } as any;
};
stub("@/database/sync", { sync: async () => ({ success: true, timestamp: Date.now() }) });
stub("@/config/supabase", { supabase: {} });

const service = require("../services/tagService") as typeof import("../services/tagService");

const USER = "user-1";
const OTHER_USER = "user-2";

const create = (name: string, userId = USER) => service.createTag({ userId, name, color: "#F43F5E" });

const rejectsWith = (promise: Promise<unknown>, message: string) =>
  assert.rejects(promise, (err: Error) => err.message === message);

describe("tagSchema", () => {
  it("trims the name", () => {
    const parsed = tagSchema.safeParse({ name: "  Guard  " });
    assert.ok(parsed.success);
    assert.equal(parsed.data.name, "Guard");
  });

  it("returns translation keys as messages", () => {
    const empty = tagSchema.safeParse({ name: "   " });
    assert.equal(empty.success ? null : empty.error.issues[0].message, "tagsValidationNameRequired");
    const long = tagSchema.safeParse({ name: "x".repeat(TAG_NAME_MAX + 1) });
    assert.equal(long.success ? null : long.error.issues[0].message, "tagsValidationNameTooLong");
  });

  it("has every message key in both locales", () => {
    for (const key of ["tagsValidationNameRequired", "tagsValidationNameTooLong", "tagsValidationNameTaken"]) {
      assert.equal(typeof (en as Record<string, string>)[key], "string", `en: ${key}`);
      assert.equal(typeof (pl as Record<string, string>)[key], "string", `pl: ${key}`);
    }
  });
});

describe("isTagNameTaken", () => {
  const tags = [{ id: "a", name: "Guard" }];
  it("compares trimmed names without case", () => {
    assert.equal(isTagNameTaken(" guard ", tags), true);
    assert.equal(isTagNameTaken("Sweep", tags), false);
  });
  it("ignores the tag being renamed", () => {
    assert.equal(isTagNameTaken("GUARD", tags, "a"), false);
  });
});

describe("tagService", () => {
  beforeEach(async () => {
    await database.write(() => database.unsafeResetDatabase());
  });

  it("creates a tag with a trimmed name", async () => {
    const tag = await create("  Guard ");
    assert.equal(tag.name, "Guard");
  });

  it("rejects an empty or too long name", async () => {
    await rejectsWith(create("   "), "tagsValidationNameRequired");
    await rejectsWith(create("x".repeat(TAG_NAME_MAX + 1)), "tagsValidationNameTooLong");
  });

  it("rejects a name the user already has, but not another user's", async () => {
    await create("Guard");
    await rejectsWith(create("guard"), "tagsValidationNameTaken");
    const other = await create("Guard", OTHER_USER);
    assert.equal(other.userId, OTHER_USER);
  });

  it("allows a name of a deleted tag", async () => {
    const tag = await create("Guard");
    await service.deleteTag(tag.id);
    assert.equal((await create("Guard")).name, "Guard");
  });

  it("renames with the same checks, letting a tag change its own case", async () => {
    const guard = await create("Guard");
    const sweep = await create("Sweep");
    assert.equal((await service.updateTag(guard.id, { name: " GUARD " })).name, "GUARD");
    await rejectsWith(service.updateTag(sweep.id, { name: "guard" }), "tagsValidationNameTaken");
    await rejectsWith(service.updateTag(sweep.id, { name: "" }), "tagsValidationNameRequired");
  });
});
