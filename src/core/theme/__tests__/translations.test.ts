import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import en from "@/core/i18n/locales/en.json";
import pl from "@/core/i18n/locales/pl.json";

const SWITCHER = path.resolve(__dirname, "../../components/ThemeSwitcher.tsx");

describe("appearance translations", () => {
  const source = readFileSync(SWITCHER, "utf8");
  const keys = [...source.matchAll(/(?:labelKey: |t\()"((?:theme|settings)[A-Za-z]+)"/g)].map((m) => m[1]);

  it("the switcher offers all three preferences", () => {
    assert.deepEqual(keys.filter((k) => k.startsWith("theme")).sort(), ["themeDark", "themeLight", "themeSystem"]);
    assert.ok(keys.includes("settingsAppearance"));
  });

  for (const [name, locale] of [["en", en], ["pl", pl]] as const) {
    it(`every key used by the switcher exists in ${name}.json`, () => {
      for (const key of keys) {
        const value = (locale as Record<string, string>)[key];
        assert.equal(typeof value, "string", `${name}.json is missing ${key}`);
        assert.ok(value.length > 0);
      }
    });
  }
});
