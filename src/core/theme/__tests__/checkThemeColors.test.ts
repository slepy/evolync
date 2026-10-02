import { describe, it } from "node:test";
import assert from "node:assert/strict";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { checkSource, knownColorNames } = require("../../../../scripts/check-theme-colors.js");

const known: Set<string> = knownColorNames();
const check = (source: string, rel = "src/modules/x/components/X.tsx"): string[] =>
  checkSource(rel, source, known);

describe("check-theme-colors", () => {
  it("accepts semantic keys, theme-aware scales and brand fills", () => {
    assert.deepEqual(
      check(`<Text color="$textPrimary" backgroundColor="$surface" borderColor="$blue7" />
<Button backgroundColor="$imperialRed" color="$pearlWhite" />
const c = theme.textSecondary?.val;`),
      [],
    );
  });

  it("flags migrated static palette tokens", () => {
    const problems = check(`<Text color="$inkBlack" />\nconst c = theme.softGrayDark?.val;`);
    assert.equal(problems.length, 2);
    assert.match(problems[0], /:1 static palette token "inkBlack"/);
    assert.match(problems[1], /:2 static palette token "softGrayDark"/);
  });

  it("flags color literals in color props, including ternary branches", () => {
    const problems = check(`<View backgroundColor="#F8FAFC" />
<Icon color={disabled ? "#94A3B8" : "#64748B"} />
const s = { backgroundColor: "white" };
<Card backgroundColor="rgba(255, 255, 255, 0.7)" />`);
    assert.deepEqual(
      problems.map((p) => p.split(" color literal ")[1]),
      ['"#F8FAFC" — use a semantic theme key', '"#94A3B8" — use a semantic theme key', '"#64748B" — use a semantic theme key',
        '"white" — use a semantic theme key', '"rgba(255, 255, 255, 0.7)" — use a semantic theme key'],
    );
  });

  it("ignores scrims, translucent accent tints and theme-read fallbacks", () => {
    assert.deepEqual(
      check(`<Sheet.Overlay backgroundColor="rgba(0, 0, 0, 0.5)" />
const s = { backgroundColor: "rgba(220, 38, 38, 0.1)" };
const defaultColor = theme.chineseCyan?.val ?? "#0891B2";`),
      [],
    );
  });

  it("honors the per-file literal allowlist", () => {
    assert.deepEqual(check(`<View backgroundColor="#000" />`, "app/techniques/threed/[sequenceId]/viewer.tsx"), []);
    assert.equal(check(`<View backgroundColor="#000" />`).length, 1);
  });

  it("flags unknown color tokens", () => {
    const problems = check(`<Text color="$softGrayBark" />\n<YStack backgroundColor={x ? "$white" : "$surface"} />`);
    assert.deepEqual(
      problems.map((p) => p.split(" unknown color token ")[1]),
      ['"$softGrayBark"', '"$white"'],
    );
  });
});
