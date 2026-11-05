# Execution plan — forced OTA update on launch

Source doc: .ai/specs/2026-11-05-forced-ota-update.md (spec PR #78)

## Goal

On every cold start a preview / production build checks its EAS Update channel,
downloads a newer JS bundle behind the launch screen ("Updating the app…") and
reloads on it before the first screen. Offline or slow: open the current bundle.

## Scope

- `expo-updates` dependency, `app.json` (`runtimeVersion` fingerprint, `updates`),
  `eas.json` channels, `update:preview` script.
- `src/core/hooks/launchUpdate.ts` (pure flow) + `useLaunchUpdate.ts`.
- `LaunchStatus` `"updating"`, `LaunchScreenView` text, `launchUpdating` (en / pl / hu).
- `app/_layout.tsx` gates `RootLayoutNav` until the check is done.
- README "Releasing a preview" note.

## Non-goals

- Minimum-build gate for native releases (separate spec).
- Checking on foreground resume; showing the update id in Settings.
- Building / publishing a preview (needs the owner's EAS account) — device
  verification (spec step 5) is left to the owner.

## Risks

- `expo-updates` is native: existing installs need one reinstall.
- `expo-dev-client` is imported in `_layout.tsx`; dev builds report
  `Updates.isEnabled === false` → the flow is skipped there.

## Progress

PR: #79

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Config

- [x] 1.1 Install expo-updates and configure runtime version, updates URL and channels — c82c503

### Phase 2: Launch update flow

- [x] 2.1 Pure launch update flow with tests — e808bf5
- [x] 2.2 Updating state on the launch screen with translations — e962692
- [x] 2.3 Gate the root layout on the launch update — 4afa2d6

### Phase 3: Docs

- [x] 3.1 Releasing a preview note in the README — 972c00f
