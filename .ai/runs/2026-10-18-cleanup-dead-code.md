# Execution plan — cleanup of dead files, dependencies, assets and translation keys

Date: 2026-10-18
Branch: feat/cleanup-dead-code
Source: `.ai/raport-porzadki.md` (cleanup report, 2026-10-18, kept outside the repo)

## Goal

Remove code, dependencies, assets and translation keys that nothing in the app, tests or build uses, then confirm typecheck, theme check and tests are still green.

## Scope

- Source files the report lists as unreachable from any entry point (`app/`, tests, scripts), after re-checking each one with a platform-aware import graph.
- Files reachable only through a barrel whose exports nobody uses; the barrels are updated.
- `package.json` dependencies with no import in `src/`, `app/`, `scripts/`, `test/` or the build config (`app.json`, `babel.config.js`, `metro.config.js`).
- Files in `assets/` not referenced by code or config.
- Translation keys in `en.json` / `pl.json` that no static `t("…")` call and no dynamic key pattern uses.

## Non-goals

- The report's "unused exports" section (removing `export` from live files): not part of the brief, wide churn, no runtime effect.
- Module root barrels (`src/modules/*/index.ts`) and sub-barrels that re-export live code stay, per the module structure in `CLAUDE.md`; only references to deleted files are removed from them.
- `src/database/adapter.ts`: the report lists it, but it is the web adapter (Metro picks `adapter.native.ts` on devices) and the test harness swaps it, so it stays.
- `src/core/i18n/index.ts`, `helpers.ts`, `types.ts`: documented public API in `src/core/i18n/README.md`; `types.ts` is an ambient `i18next` augmentation read by `tsc`. They stay.

## Implementation Plan

### Phase 1: Dead source files

1. Delete unreachable files confirmed by the import graph and fix the barrels that referenced them.
2. Delete barrel-only files whose exports nobody imports and remove them from their barrels.

### Phase 2: Dependencies and assets

1. Remove dependencies with no import or config reference.
2. Delete unreferenced assets.

### Phase 3: Translation keys

1. Remove unused keys from `en.json` and `pl.json` (after the Phase 1 deletions), keeping keys built dynamically.

### Phase 4: Validation

1. Run `npm run typecheck`, `npm run check:theme` and `npm test`.

## Risks

- Dynamic imports or keys built at runtime can look unused: checked by grepping template-literal key prefixes and `require()` of assets.
- Native-only packages (Expo config plugins, peer deps of other packages) can have no JS import: each removal is checked against `app.json` plugins and peer dependency lists.
- No device build runs in this gate; a removed native dependency shows up only on the next EAS build.
- `.claude/skills/threed-guide/SKILL.md` still lists `utils/ikSystem.ts`: editing `.claude/` was denied in this run.
- Found, not fixed (pre-existing): `src/modules/auth/hooks/useAuth.ts` calls `t('errorNoInternetMessage')`, `t('errorLoginFailedMessage')`, `t('errorGoogleRequiresInternetMessage')`, which exist in neither locale, so users see the raw key. Their wording lives in `errorNoInternet` / `errorLoginFailed` / `errorGoogleRequiresInternet`, which this run keeps.

## Deviations from the report

- Kept `src/database/adapter.ts` (web adapter, swapped by `test/register.cjs`), the `src/core/i18n` trio and module barrels (see Non-goals).
- Kept `src/modules/trainings/hooks/useUpcomingTrainings.ts`: unused by the app but covered by `trainings/__tests__/hooks.test.ts`.
- Kept 23 `trainingsWeekday*` / `trainingsWeekOfMonth*` keys: built with template literals in `src/modules/trainings`.
- Removed 30 more keys than the report: their only users were files deleted in Phase 1.
- Dependencies and assets are not in the report; they come from this run's own scan (`expo-gl`, `expo-linking`, `expo-system-ui`, `react-native-screens`, `react-native-worklets`, `react-dom`, `react-native-web` have no import but are peers or platform packages and stay).

## Progress

PR: #50

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Dead source files

- [x] 1.1 Delete unreachable files — 91c7ac0
- [x] 1.2 Delete barrel-only files with unused exports — 8d33bfc

### Phase 2: Dependencies and assets

- [x] 2.1 Remove unused dependencies — 18d8baf
- [x] 2.2 Delete unreferenced assets — 07ca3e5

### Phase 3: Translation keys

- [x] 3.1 Remove unused translation keys — 310a2f7

### Phase 4: Validation

- [x] 4.1 Run typecheck, theme check and tests — 310a2f7
