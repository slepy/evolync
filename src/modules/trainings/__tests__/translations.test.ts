import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import en from "@/core/i18n/locales/en.json";
import pl from "@/core/i18n/locales/pl.json";

const ROOT = path.resolve(__dirname, "../../../..");
const SOURCES = [
  "src/modules/trainings",
  "app/organization/trainings",
  "src/core/components/ChoiceList",
  "src/core/components/AudienceChoice",
  "src/core/components/PillGroup",
  "src/core/components/DateTimeField",
  "app/user/dashboard.tsx",
  "src/modules/organization/components/Dashboard.tsx",
  "src/modules/dashboard/components/SchoolDashboard.tsx",
];

const files = (entry: string): string[] => {
  const full = path.join(ROOT, entry);
  if (!existsSync(full)) return [];
  if (statSync(full).isFile()) return [full];
  return readdirSync(full).flatMap((name) =>
    name === "__tests__" ? [] : files(path.join(entry, name)),
  );
};

const PLURAL = { en: ["one", "other"], pl: ["one", "few", "many", "other"] } as const;

/** Every t("key") call plus validation/error message keys thrown or returned as strings. */
const usedKeys = () => {
  const keys = new Set<string>();
  for (const file of SOURCES.flatMap(files).filter((f) => /\.tsx?$/.test(f))) {
    const source = readFileSync(file, "utf8");
    for (const m of source.matchAll(/\bt\(\s*"([A-Za-z0-9_]+)"/g)) keys.add(m[1]);
    for (const m of source.matchAll(/"((?:trainings|eventValidation)[A-Z][A-Za-z0-9]+)"/g)) keys.add(m[1]);
  }
  return [...keys];
};

describe("trainings translations", () => {
  const keys = usedKeys();

  it("finds the keys used by the module", () => {
    assert.ok(keys.includes("trainingsValidationPastDate"));
    assert.ok(keys.length > 20);
  });

  for (const [name, locale] of [["en", en], ["pl", pl]] as const) {
    it(`every used key exists in ${name}.json (with plural forms)`, () => {
      const dict = locale as Record<string, string>;
      const missing = keys.filter((key) => {
        if (typeof dict[key] === "string") return false;
        return !PLURAL[name].every((form) => typeof dict[`${key}_${form}`] === "string");
      });
      assert.deepEqual(missing, [], `${name}.json is missing keys`);
    });
  }

  it("trainings keys exist in both locales", () => {
    const base = (k: string) => k.replace(/_(one|few|many|other)$/, "");
    const enKeys = new Set(Object.keys(en).filter((k) => k.startsWith("trainings")).map(base));
    const plKeys = new Set(Object.keys(pl).filter((k) => k.startsWith("trainings")).map(base));
    assert.deepEqual([...enKeys].filter((k) => !plKeys.has(k)), []);
    assert.deepEqual([...plKeys].filter((k) => !enKeys.has(k)), []);
  });
});
