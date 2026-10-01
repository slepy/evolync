import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import en from "@/core/i18n/locales/en.json";
import pl from "@/core/i18n/locales/pl.json";

const MODULE_DIR = path.resolve(__dirname, "..");

/** Every literal `notification*` key passed to t()/translate() in the module. */
function usedKeys(dir: string): Set<string> {
  const keys = new Set<string>();
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (entry === "__tests__") continue;
    if (statSync(full).isDirectory()) {
      usedKeys(full).forEach((k) => keys.add(k));
    } else if (/\.tsx?$/.test(entry)) {
      const source = readFileSync(full, "utf8");
      for (const match of source.matchAll(/(?:\bt|translate)\("(notification[A-Za-z]*)"/g)) {
        keys.add(match[1]);
      }
    }
  }
  return keys;
}

const placeholders = (value: string) => [...value.matchAll(/{{(\w+)}}/g)].map((m) => m[1]).sort();

describe("notification translations", () => {
  const keys = usedKeys(MODULE_DIR);
  const locales = { en: en as Record<string, string>, pl: pl as Record<string, string> };

  it("finds the keys the module uses", () => {
    assert.ok(keys.size >= 20, `expected the module's keys, found ${keys.size}`);
  });

  for (const [name, dict] of Object.entries(locales)) {
    it(`${name}.json defines every key the module uses`, () => {
      const missing = [...keys].filter((k) => typeof dict[k] !== "string");
      assert.deepEqual(missing, []);
    });
  }

  it("en and pl use the same placeholders for every notification key", () => {
    const allKeys = Object.keys(locales.en).filter((k) => k.startsWith("notification"));
    for (const key of allKeys) {
      const base = key.replace(/_(one|few|many|other)$/, "");
      const plValue = locales.pl[key] ?? locales.pl[base];
      assert.ok(plValue, `pl is missing ${key}`);
      // Plural forms may inline the count ("1 item"), so compare against the base key's set.
      const expected = placeholders(locales.en[base]).filter((p) => p !== "count");
      const actual = placeholders(plValue).filter((p) => p !== "count");
      assert.deepEqual(actual, expected, `placeholder mismatch for ${key}`);
    }
  });
});
