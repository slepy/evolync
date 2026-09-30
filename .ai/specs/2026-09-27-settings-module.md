# Settings — Specification (as-built + remediation)

> **Status (2026-09-30):** All three fixes are implemented. Verified by direct code inspection: `src/modules/settings/` is gone and `settingsSchema` no longer appears in `src/database/schema.ts` (fix #1); `app/_layout.tsx` no longer keys the `<Stack>` on the language, while the `languageChanged` listener still drives the re-render (fix #2); `app/school/[schoolId]/settings.tsx` and `SchoolDashboard.tsx`'s settings tile use `settingsSchool`, and `app/user/settings.tsx`/`Header.tsx` keep `settingsTitle` (fix #3). The two feature gaps (dark mode, account management) and the paused "Create Organization" card remain future work, unchanged.

## 📝 TLDR
`src/modules/settings/` contained only two empty placeholder files (no components, hooks, repositories, or tables) — it has been deleted. The real "Settings" feature is, and remains, split across three places: `src/core/i18n/` (language, persisted per-device via AsyncStorage/localStorage), `src/modules/core/components/Header.tsx` (sign-out, menu entry point), and `src/modules/auth/` (profile editing). A separate, unrelated `/school/[schoolId]/settings` screen (school name/address/currency/payment defaults) is owned by the `school` module and reached only from a school's own dashboard — this spec documents it exists but doesn't re-describe it (already covered in the `organization`/`school` spec). Three fixes have already landed; two feature gaps (dark mode, account management) are recorded as future-spec candidates, and one paused/reserved UI element is documented as intentional, not dead.

## 📝 Problem Statement (as found)
- `src/modules/settings/` was dead scaffolding — an empty `settingsSchema` array and an empty types stub, contributing nothing but a harmless no-op spread into the bootstrap schema.
- Every language change forced a full remount of the root navigation `<Stack>` (`key={languageKey}`), discarding the user's current screen/navigation position — a side effect of working around the fact that most of the app calls the non-reactive global `t()` rather than the reactive `useTranslation()` hook.
- Two different screens ("app settings" at `/user/settings` and "school settings" at `/school/[schoolId]/settings") shared the identical i18n key `settingsTitle` for their header titles, despite being unrelated features reached from unrelated entry points — a latent key-collision risk (a translator or future editor changing one screen's title text would silently also change the other's).
- No dark mode, no password change/account deletion/data export exist.
- A commented-out "Create Organization" card in `app/user/settings.tsx` looked like abandoned dead code at first glance.

## 📝 Proposed Solution
Three fixes already implemented:

1. **Deleted `src/modules/settings/`** and removed its `settingsSchema` import/spread from `src/database/schema.ts`. Zero behavior change — the module owned no tables and had no consumers besides that spread.
2. **Language change no longer remounts the navigation stack.** `app/_layout.tsx`'s `RootLayoutNav` still re-renders on `i18n`'s `languageChanged` event (so screens using the global `t()` pick up new strings), but no longer passes that state as the `<Stack>`'s `key` — a re-render cascades through the tree without unmounting/remounting it, preserving the user's current screen and navigation history.
3. **Split the colliding `settingsTitle` key**: the school-settings screen (`app/school/[schoolId]/settings.tsx`) and its dashboard tile (`SchoolDashboard.tsx`) now use the pre-existing (but previously unused) `settingsSchool` key instead of `settingsTitle`. The app-settings screen (`app/user/settings.tsx`) and the header menu (`Header.tsx`) keep `settingsTitle`, unchanged. No visible text change — the two keys already had the correct, distinct display strings in both `en.json`/`pl.json`; only the code-level ambiguity is fixed.

**Confirmed as intentional, not changed by this spec**:
- **Theme stays light-only for now**; dark mode is a real, wanted future feature — flagged as a future-spec candidate, not designed here (the dead `Themed.tsx`/`useColorScheme` Expo-template boilerplate should not be mistaken for a working implementation when that spec is eventually written).
- **No password change / account deletion / data export** — confirmed as planned future work, not built in this pass.
- **The commented-out "Create Organization" card in `app/user/settings.tsx`** is a deliberately paused feature, reserved for a future flow letting a user without an organization create one from the settings screen — left commented out as-is, not dead code to remove.

## 📝 Architecture
No new modules. The `settings` module's removal leaves the app's actual settings/preferences functionality exactly where it already lived: `core` (i18n, Header), `auth` (profile), and `school` (school-level settings, out of scope here).

## 📝 Data Model
No schema changes. Deleting `settingsSchema` (an empty array) is a pure no-op at the data layer.

## 📝 API Contracts
No public contract changes. `RootLayoutNav`'s internal state variable was renamed (`languageKey` → an unnamed re-render trigger) and is no longer passed as a prop anywhere — purely internal.

## 📝 UI/UX
- Language switching now preserves the current screen instead of bouncing back to the initial route on every change.
- No visible text changes from the key-collision fix — both screens still show their existing, already-correct titles.

## 📝 Edge Cases & Failure Scenarios
| Scenario | Before | After |
|---|---|---|
| User switches language while deep in a nested screen | Full stack remount, returned to the initial route | Stays on the current screen, text updates in place |
| Editor changes the app-settings screen's title translation | Risk of also silently changing the school-settings screen's title (same key) | Each screen has its own key — changing one no longer affects the other |
| User without an organization opens Settings | Sees no path to create one (card commented out, no explanation) | Unchanged — confirmed intentional, reserved for a future flow |

## 📝 Risks & Impact Review
- All three fixes are low blast radius: one dead-code deletion, one internal state/prop change with no external contract, one i18n key rename onto an already-correct, pre-existing key.
- The re-render-without-remount fix (#2) relies on the existing ubiquitous non-reactive global `t()` pattern still being re-triggered by a parent re-render — this works because React re-renders a whole subtree on a state change unless something is memoized; if a future refactor introduces `React.memo` high in the tree without care, language-change propagation could silently stop working. Worth a regression check if that ever happens.
- **Two real feature gaps are carried forward, not resolved**: dark mode and account management (password change, deletion, data export). Both are confirmed real, wanted future work — recorded here as future-spec candidates, the same pattern used for password reset (`auth`) and announcements (`dashboard`) in earlier specs.

## 📋 Phasing
All three fixes have already landed; no further phasing needed for this pass.
- **Fix #1** — Delete dead `src/modules/settings/` scaffolding. *Status: ✅ implemented.*
- **Fix #2** — Language change re-renders instead of remounting the navigation stack. *Status: ✅ implemented.*
- **Fix #3** — Split the colliding `settingsTitle` key. *Status: ✅ implemented.*
- **(Future spec, not designed here)** — Dark mode.
- **(Future spec, not designed here)** — Account management (password change, account deletion, data export).
- **(Future work, not designed here)** — "Create Organization" flow for users without one, from the settings screen (the commented-out card is a placeholder for this).

## 📋 Implementation Plan (already executed)
1. Deleted `src/modules/settings/`; removed its import/spread from `src/database/schema.ts`.
2. Removed `key={languageKey}` from `app/_layout.tsx`'s `<Stack>` while keeping the `languageChanged`-driven re-render, so language changes propagate via re-render instead of remount.
3. Changed `app/school/[schoolId]/settings.tsx` and `SchoolDashboard.tsx`'s settings tile to use `settingsSchool` instead of `settingsTitle`.

Verification: `npm run typecheck` shows no errors in `src/database/schema.ts`, `app/_layout.tsx`, `app/school/[schoolId]/settings.tsx`, or `src/modules/dashboard/components/SchoolDashboard.tsx` — remaining typecheck output is pre-existing, unrelated errors in other modules already noted in prior specs' verification passes. Direct code inspection on 2026-09-30 confirms all three fixes are present on `main` (see Status banner above).
