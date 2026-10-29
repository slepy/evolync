import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import i18n from "i18next";
import { z } from "zod";
import { localizedSchema } from "../localizedSchema";

const messages = {
  en: { translation: { passwordsMustMatch: "Passwords do not match" } },
  pl: { translation: { passwordsMustMatch: "Hasła się różnią" } },
};

describe("localizedSchema", () => {
  const originalT = (globalThis as any).t;

  before(async () => {
    await i18n.init({ resources: messages, lng: "pl", fallbackLng: "en" });
    (globalThis as any).t = (key: string) => (i18n.t as (k: string) => string)(key);
  });

  after(() => {
    (globalThis as any).t = originalT;
  });

  const schema = localizedSchema(() =>
    z
      .object({ password: z.string(), confirmPassword: z.string() })
      .refine((d) => d.password === d.confirmPassword, {
        message: t("passwordsMustMatch"),
        path: ["confirmPassword"],
      }),
  );
  const mismatch = () => {
    const result = schema.safeParse({ password: "a", confirmPassword: "b" });
    assert.equal(result.success, false);
    return result.error!.issues[0].message;
  };

  it("messages follow a language change after the schema was created", async () => {
    assert.equal(mismatch(), "Hasła się różnią");
    await i18n.changeLanguage("en");
    assert.equal(mismatch(), "Passwords do not match");
  });

  it("builds the schema once per language", async () => {
    let builds = 0;
    const counted = localizedSchema(() => {
      builds += 1;
      return z.string();
    });
    counted.parse("a");
    counted.parse("b");
    assert.equal(builds, 1);
    await i18n.changeLanguage("pl");
    counted.parse("c");
    assert.equal(builds, 2);
  });

  it("still validates and infers like the built schema", () => {
    const parsed: { password: string; confirmPassword: string } = schema.parse({ password: "x", confirmPassword: "x" });
    assert.deepEqual(parsed, { password: "x", confirmPassword: "x" });
  });
});
