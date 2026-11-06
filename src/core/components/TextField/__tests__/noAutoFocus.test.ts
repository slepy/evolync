import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Opening a form screen or sheet (Grading list with its rank sheet, add
 * student, tag, note…) used to pop up the system keyboard before any tap,
 * because the first field had `autoFocus`. The keyboard must open only when
 * the user taps an input, so no component may auto-focus a field (#80).
 */

const root = join(__dirname, "../../../../..");

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "__tests__" ? [] : sourceFiles(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });

describe("no auto-focused inputs", () => {
  it("never focuses a field on mount", () => {
    const offenders = sourceFiles(join(root, "src"))
      .filter((file) => /\bautoFocus/.test(readFileSync(file, "utf8")))
      .map((file) => relative(root, file));
    assert.deepEqual(offenders, []);
  });
});
