#!/usr/bin/env node
/**
 * Dark-mode guardrail: fails when UI code paints with colors that do not
 * follow the active theme. Screens must use the semantic theme keys defined
 * in tamagui.config.ts (`$textPrimary`, `$surface`, …) — see
 * .ai/specs/2026-10-02-dark-mode.md.
 *
 * Flags, in app/ and src/ (.ts/.tsx, tests excluded):
 *   1. Migrated static palette tokens (`$inkBlack`, `$softGrayDark`,
 *      `$jadeGreenLighter`, … and `theme.inkBlack.val`-style reads).
 *   2. Color literals (hex, rgb(), translucent white rgba, "white"/"black")
 *      in color props or style keys, outside ALLOWED_LITERALS. Scrims and
 *      translucent accent tints (other rgba) read fine on both themes, and
 *      `?? "#hex"` / `|| "#hex"` fallbacks after a theme read are ignored.
 *   3. `$tokens` in color props that are neither a theme key nor a color
 *      token (typos such as `$softGrayBark` silently render nothing).
 *
 * Usage: node scripts/check-theme-colors.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SCAN_DIRS = ["app", "src"];
// The one place raw color values live; tamagui.config.ts turns them into tokens.
const TOKENS_FILE = "src/core/theme/tokens.ts";

// Static palette tokens replaced by semantic keys. Solid brand fills
// ($imperialRed, $jadeGreen, …) and on-accent white ($pearlWhite*) stay allowed.
const MIGRATED_TOKENS = [
  "inkBlack", "inkBlackLight",
  "softGray", "softGrayDark", "softGrayLight", "softGrayLighter",
  "jadeGreenLighter", "imperialRedLighter", "chineseGoldLighter",
  "chineseCyanLighter", "darkBlueLighter", "chineseCoralLighter",
];

// Literals that are intentionally theme-independent, per file:
// the 3D canvas and its overlays (spec Q3), scrims, on-accent white, data colors.
const ALLOWED_LITERALS = {
  "app/techniques/threed/technique/[techniqueId].tsx": ["#000", "#fff"],
  "app/techniques/threed/[sequenceId]/viewer.tsx": ["#000", "#fff"],
  "app/techniques/threed/[sequenceId]/edit.tsx": ["#000", "#fff", "#cc3333", "white"],
  "app/techniques/threed/[sequenceId]/_layout.tsx": ["#000"],
  "app/techniques/threed/[sequenceId]/index.tsx": ["white"],
  "app/auth/reset-password.tsx": ["#16A34A"],
  "src/modules/threed/components/BoneControlPanel.tsx": ["*"],
  "src/modules/threed/components/BoneMarker.tsx": ["*"],
  "src/modules/threed/components/BoneGizmo.tsx": ["*"],
  "src/modules/threed/components/IKTargetGizmo.tsx": ["*"],
  "src/modules/threed/components/AxisGizmo.tsx": ["*"],
  "src/modules/threed/components/ThreeDCanvas.tsx": ["*"],
  "src/modules/threed/components/HumanModel.tsx": ["*"],
  "src/modules/threed/components/HandEditorPanel.tsx": ["white"],
  "src/modules/threed/components/HandEditorTab.tsx": ["white"],
  "src/modules/grading/components/ColorPickerSheet.tsx": ["#FFFFFF"],
  "src/modules/grading/components/RankListItem.tsx": ["white"],
  "src/modules/core/components/SubmitComponent.tsx": ["black"],
  "src/modules/core/components/ErrorBanner.tsx": ["#DC2626"],
  "src/modules/core/components/PhoneInput.tsx": ["#3b82f6"],
  "src/modules/auth/components/LoginForm.tsx": ["#DC2626"],
  "src/modules/notifications/components/NotificationBell.tsx": ["white"],
  "src/modules/notifications/components/PushPermissionPrompt.tsx": ["white"],
};

const COLOR_PROP = String.raw`(?:[A-Za-z]*[Cc]olor|[A-Za-z]*[Bb]ackground|bg|bgColor|[a-z]*Bg|fill|stroke)`;
const LITERAL = String.raw`#[0-9A-Fa-f]{3,8}|rgb\([^)]*\)|rgba\(\s*255\s*,\s*255\s*,\s*255\s*,[^)]*\)|white|black`;
const LITERAL_RE = new RegExp(String.raw`["'](${LITERAL})["']`, "g");
const MIGRATED_RE = new RegExp(
  String.raw`["']\$(${MIGRATED_TOKENS.join("|")})["']|theme\.(${MIGRATED_TOKENS.join("|")})\b`,
  "g",
);
const COLOR_PROP_RE = new RegExp(String.raw`\b${COLOR_PROP}\s*(?:=\s*\{?|:)`, "g");
// A prop's value ends where the next JSX attribute or object key starts.
const NEXT_PROP_RE = /\s[A-Za-z]+=["{]|,\s*[A-Za-z]+\s*:/;

/** The value expressions of every color prop on a line (ternary branches included). */
function colorPropValues(line) {
  return [...line.matchAll(COLOR_PROP_RE)].map((m) => {
    const rest = line.slice(m.index + m[0].length);
    const end = rest.search(NEXT_PROP_RE);
    return end === -1 ? rest : rest.slice(0, end);
  });
}

function knownColorNames() {
  const names = new Set();
  const { config } = require("@tamagui/config/v3");
  Object.keys(config.tokens.color).forEach((k) => names.add(k));
  Object.keys(config.themes.light).forEach((k) => names.add(k));
  const source = fs.readFileSync(path.join(ROOT, "tamagui.config.ts"), "utf8");
  for (const match of source.matchAll(/^\s{2,4}([A-Za-z0-9]+):\s*"(?:#|rgba?\()/gm)) {
    names.add(match[1]);
  }
  // Redesign tokens read from src/core/theme/tokens.ts (`neutralCard: neutral.card`).
  for (const match of source.matchAll(/^\s{2,4}([A-Za-z0-9]+):\s*(?:neutral|danger|warning)\.[A-Za-z]+,/gm)) {
    names.add(match[1]);
  }
  // Generated per module ($studentsTint, …) and per context ($schoolLabel, …).
  const tokens = fs.readFileSync(path.join(ROOT, TOKENS_FILE), "utf8");
  const unionOf = (type) =>
    [...(tokens.match(new RegExp(String.raw`export type ${type} =([^;]+);`))?.[1] ?? "").matchAll(/"([a-z]+)"/g)].map((m) => m[1]);
  for (const module of unionOf("ModuleKey")) {
    for (const key of ["Tint", "Fill", "From", "To", "ButtonText"]) names.add(module + key);
  }
  for (const context of unionOf("ContextKey")) {
    for (const key of ["From", "Via", "To", "Fg", "FgSoft", "Glow", "Label", "Fill"]) names.add(context + key);
  }
  names.add("transparent");
  return names;
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "__tests__" || entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.tsx?$/.test(entry.name)) files.push(full);
  }
  return files;
}

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Problems in one file's source. `rel` is the repo-relative path. */
function checkSource(rel, source, known) {
  const allowed = rel === TOKENS_FILE ? ["*"] : (ALLOWED_LITERALS[rel] ?? []);
  const problems = [];

  source.split("\n").forEach((line, i) => {
    const where = `${rel}:${i + 1}`;

    for (const m of line.matchAll(MIGRATED_RE)) {
      const token = m[1] ?? m[2];
      problems.push(`${where} static palette token "${token}" — use a semantic theme key`);
    }

    const values = colorPropValues(line);

    if (!allowed.includes("*")) {
      for (const m of values.flatMap((value) => [...value.matchAll(LITERAL_RE)])) {
        const literal = m[1];
        const isFallback = new RegExp(String.raw`(\?\?|\|\|)\s*["']${escapeRegExp(literal)}["']`).test(line);
        if (!allowed.includes(literal) && !isFallback) {
          problems.push(`${where} color literal "${literal}" — use a semantic theme key`);
        }
      }
    }

    for (const value of values) {
      for (const t of value.matchAll(/["']\$([A-Za-z][A-Za-z0-9]*)["']/g)) {
        if (!known.has(t[1])) {
          problems.push(`${where} unknown color token "$${t[1]}"`);
        }
      }
    }
  });
  return problems;
}

function check() {
  const known = knownColorNames();
  const files = SCAN_DIRS.flatMap((d) => walk(path.join(ROOT, d)));
  const problems = files.flatMap((file) =>
    checkSource(path.relative(ROOT, file).split(path.sep).join("/"), fs.readFileSync(file, "utf8"), known),
  );
  return { problems, fileCount: files.length };
}

module.exports = { checkSource, knownColorNames };

if (require.main === module) {
  const { problems, fileCount } = check();
  if (problems.length > 0) {
    console.error(problems.join("\n"));
    console.error(`\ncheck-theme-colors: ${problems.length} problem(s) in ${fileCount} files.`);
    process.exit(1);
  }
  console.log(`check-theme-colors: ${fileCount} files OK.`);
}
