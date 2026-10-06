import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import en from "@/core/i18n/locales/en.json";
import pl from "@/core/i18n/locales/pl.json";

const ROOT = path.resolve(__dirname, "../../../..");
const SOURCES = [
  "src/modules/payments/components",
  "src/modules/payments/constants.ts",
  "src/modules/attendance/components",
  "src/modules/attendance/constants.ts",
  "app/school/[schoolId]/payments",
  "app/school/[schoolId]/attendance",
  "src/core/components/List",
  "src/core/components/StatusButton",
];

const files = (entry: string): string[] => {
  const full = path.join(ROOT, entry);
  if (!existsSync(full)) return [];
  if (statSync(full).isFile()) return [full];
  return readdirSync(full).flatMap((name) => (name === "__tests__" ? [] : files(path.join(entry, name))));
};

const PLURAL = { en: ["one", "other"], pl: ["one", "few", "many", "other"] } as const;

/** Every t("key") call plus label keys kept as strings in style maps ("statusPaid", "paymentsMethodCash"…). */
const usedKeys = () => {
  const keys = new Set<string>();
  for (const file of SOURCES.flatMap(files).filter((f) => /\.tsx?$/.test(f))) {
    const source = readFileSync(file, "utf8");
    for (const m of source.matchAll(/\bt\(\s*"([A-Za-z0-9_]+)"/g)) keys.add(m[1]);
    for (const m of source.matchAll(/"((?:payments|attendance|status)[A-Z][A-Za-z0-9]+)"/g)) keys.add(m[1]);
  }
  return [...keys];
};

describe("payments and attendance translations", () => {
  const keys = usedKeys();

  it("finds the keys used by the screens", () => {
    assert.ok(keys.includes("paymentsBillingPeriods"));
    assert.ok(keys.includes("attendanceStatusHint"));
    assert.ok(keys.includes("paymentsMethodCashHint"));
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
});
