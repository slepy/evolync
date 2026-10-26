import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import i18n from "i18next";
import en from "@/core/i18n/locales/en.json";
import pl from "@/core/i18n/locales/pl.json";
import { registerSchema } from "../validation/registerSchema";

describe("registerSchema messages", () => {
  const originalT = (globalThis as any).t;

  before(async () => {
    // The app starts in Polish, then the user switches to English on the sign-up screen.
    await i18n.init({ resources: { en: { translation: en }, pl: { translation: pl } }, lng: "pl", fallbackLng: "en" });
    (globalThis as any).t = (key: string, params?: object) => (i18n.t as (k: string, p?: object) => string)(key, params);
  });

  after(() => {
    (globalThis as any).t = originalT;
  });

  const mismatchMessage = () => {
    const result = registerSchema.safeParse({
      email: "ola@test.local",
      password: "Secret123!",
      confirmPassword: "Secret123?",
    });
    assert.equal(result.success, false);
    return result.error!.issues.find((i) => i.path[0] === "confirmPassword")?.message;
  };

  it("are in the current language, not the one the app started in", async () => {
    assert.equal(mismatchMessage(), pl.passwordsMustMatch);
    await i18n.changeLanguage("en");
    assert.equal(mismatchMessage(), en.passwordsMustMatch);
  });
});
