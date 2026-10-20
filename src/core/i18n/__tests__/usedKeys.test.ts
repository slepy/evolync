import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import en from "@/core/i18n/locales/en.json";
import pl from "@/core/i18n/locales/pl.json";
import hu from "@/core/i18n/locales/hu.json";

const ROOT = path.resolve(__dirname, "../../../..");

const sources = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return name === "__tests__" ? [] : sources(full);
    return /\.tsx?$/.test(name) && !name.endsWith(".d.ts") ? [full] : [];
  });

/** Drops block and line comments, so usage examples in docs are not counted. */
const withoutComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");

/** Every static t("key") / t('key') call in src/ and app/, with the files using it. */
const usedKeys = () => {
  const keys = new Map<string, string[]>();
  for (const file of [...sources(path.join(ROOT, "src")), ...sources(path.join(ROOT, "app"))]) {
    for (const m of withoutComments(readFileSync(file, "utf8")).matchAll(/\bt\(\s*["']([A-Za-z0-9_.]+)["']/g)) {
      keys.set(m[1], [...(keys.get(m[1]) ?? []), path.relative(ROOT, file)]);
    }
  }
  return keys;
};

const PLURAL = { en: ["one", "other"], pl: ["one", "few", "many", "other"], hu: ["one", "other"] } as const;

describe("translation keys used in code", () => {
  const keys = usedKeys();

  it("finds the keys of the whole app", () => {
    assert.ok(keys.size > 500);
    assert.ok(keys.has("errorNoInternet"));
  });

  for (const [name, locale] of [["en", en], ["pl", pl], ["hu", hu]] as const) {
    it(`every t("key") exists in ${name}.json (with plural forms)`, () => {
      const dict = locale as Record<string, string>;
      const missing = [...keys.keys()]
        .filter((key) => typeof dict[key] !== "string")
        .filter((key) => !PLURAL[name].every((form) => typeof dict[`${key}_${form}`] === "string"))
        .map((key) => `${key} (${[...new Set(keys.get(key))].join(", ")})`);
      assert.deepEqual(missing, [], `${name}.json is missing keys`);
    });
  }

  it("every en.json key is referenced in code (t() call, schema message or key map)", () => {
    const code = [...sources(path.join(ROOT, "src")), ...sources(path.join(ROOT, "app"))]
      .map((file) => withoutComments(readFileSync(file, "utf8")))
      .join("\n");
    // Built at runtime: trainingsWeekdayLong${weekday}, trainingsWeekOfMonth${week}…
    const dynamic = /^trainings(WeekdayLong|WeekdayShort|WeekOfMonthOrdinal|WeekOfMonth)(\d|Last)$/;
    const unused = [...new Set(Object.keys(en).map((key) => key.replace(/_(one|other)$/, "")))]
      .filter((key) => key !== "locale" && !dynamic.test(key))
      .filter((key) => !new RegExp(`["'\`]${key}["'\`]`).test(code));
    assert.deepEqual(unused, [], "unused keys: remove them from en.json, pl.json and hu.json");
  });

  it("hu.json has exactly the keys of en.json", () => {
    const enKeys = Object.keys(en).sort();
    assert.deepEqual(Object.keys(hu).sort(), enKeys);
  });
});
