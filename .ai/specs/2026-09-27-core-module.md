# Core — Specification (as-built + remediation)

## 📝 TLDR
"Core" spans two locations: `src/core/` (i18n infrastructure only — language switching, the global `t()`, already covered in the `settings` spec) and `src/modules/core/` (generic, domain-agnostic shared UI components/hooks/utils — `BaseCard`, `Header`, `OptionsSheet`, `PickerSheet`, `SubmitComponent`/`useDirtyFlag`, `confirmDelete`, `uploadImage`, formatters, and more). Neither owns any WatermelonDB table — clean on the schema-registration check that found bugs in 6 of the other 12 modules. One real violation of CLAUDE.md's "core never imports from other modules" rule was found and fixed (`Header` importing `useAuth` directly); five dead-code clusters were removed; one component was brought into compliance with the `BaseCard` convention it was itself supposed to model. `deleteImage` remains a documented, not-yet-executed proposal (same finding already recorded in the `inventory` spec).

## 📝 Problem Statement (as found)
- `src/modules/core/components/Header.tsx` — used on nearly every authenticated screen — imported `useAuth` from `@/modules/auth` directly, to call `signOut()` from its logout menu item. This is a literal violation of CLAUDE.md's "core never imports from other modules" rule, and meant every `Header` mount independently subscribed to Supabase's `onAuthStateChange` (redundant, though harmless).
- A duplicate, unused Supabase client (`src/modules/core/utils/supabase.ts`) existed alongside the real one (`src/config/supabase.ts`), with a different (weaker) auth-storage backend — a landmine for any future accidental import.
- A full Expo Router default-template cluster (`Themed.tsx`, `EditScreenInfo.tsx`, `ExternalLink.tsx`, `StyledText.tsx`, `constants/Colors.ts`, `useColorScheme`/`useColorScheme.web`, `useClientOnlyValue`/`useClientOnlyValue.web`, and their test) sat unintegrated with the app's real Tamagui-based theming — except for one live consumer: `app/+not-found.tsx` (Expo Router's 404 screen) still used the dead `Themed` wrapper.
- `Divider` (component) and `src/modules/core/index.ts` (a near-empty, stale barrel — the real barrel everyone actually imports from is `components/index.ts`) were both dead/vestigial.
- `AccordionSection` — itself a `core` component — rendered a raw Tamagui `Card` instead of `BaseCard`, the exact convention CLAUDE.md mandates it should model for the rest of the app.
- `deleteImage` (Supabase Storage cleanup counterpart to the used `uploadImage`) has zero call sites — already flagged as a proposal in the `inventory` spec, not re-litigated here.

## 📝 Proposed Solution — implemented
1. **Fixed the `core → auth` import violation** via a small dependency-inversion bridge: `src/modules/core/utils/signOutBridge.ts` (new) exposes `registerSignOutHandler(fn)` and `signOut()`. `Header.tsx` now calls the bridge's `signOut()` instead of importing `useAuth`. The real implementation is registered once, at the app root (`app/_layout.tsx`, which sits above the module-boundary rule — it's app-level Expo Router code, not a module), via a `useEffect` that calls `registerSignOutHandler(signOut)`. This also happens to fix the redundant-subscription side effect: previously every `Header` instance ran its own `useAuth()` (and thus its own `onAuthStateChange` subscription); now there's exactly one, at the root.
2. **Deleted the dead duplicate Supabase client** (`src/modules/core/utils/supabase.ts`) — confirmed zero imports anywhere before removal.
3. **Removed the entire dead Expo-template cluster** (`Themed.tsx`, `EditScreenInfo.tsx`, `ExternalLink.tsx`, `StyledText.tsx`, `constants/Colors.ts`, both `useColorScheme` variants, both `useClientOnlyValue` variants, and the associated test file). Its one live consumer, `app/+not-found.tsx`, was rewritten to use Tamagui (`Text`, `YStack`) directly, matching the rest of the app, before the cluster was deleted — the 404 screen's behavior/appearance is otherwise unchanged.
4. **Removed `Divider`** (component + barrel export) — confirmed zero live usages (one commented-out reference in `app/auth/register/instructor.tsx` was cleaned up alongside its now-unused import).
5. **Removed `src/modules/core/index.ts`** — confirmed its only reference anywhere was a doc-comment example in `src/core/i18n/README.md`, not a real import; the actual public surface everyone uses is `@/modules/core/components`, `@/modules/core/hooks`, `@/modules/core/utils` directly.
6. **`AccordionSection` now renders `BaseCard`** instead of a raw `Card`. The swap is behavior-preserving: the section's actual press/expand logic already lived on two independently-handled nested zones (the header content area and the chevron), not on the outer container itself, so `BaseCard`'s required `onPress` is passed as an inert no-op and its default press/hover animation is neutralized (`pressStyle={{}}`, `hoverStyle={{}}`) — the outer frame's visual styling and every existing interaction are unchanged; only the underlying primitive now matches the convention.

**Confirmed as intentional, not changed by this pass:**
- **`deleteImage` remains an unexecuted proposal** — the same finding already recorded in `.ai/specs/2026-09-27-inventory-module.md`. Not implemented here, per direction, to keep this pass's scope to `core`'s own findings.

## 📝 Architecture
- `src/core/` = i18n infrastructure only (unchanged, already documented in the `settings` spec).
- `src/modules/core/` = generic shared UI/hooks/utils, following the standard module shape minus `database/services/repositories/types/validation` (it owns no domain data). This boundary was previously undocumented anywhere in the codebase — this spec is the first place it's written down.
- **`core` now has zero static imports of any other module**, restoring the CLAUDE.md invariant. The one remaining cross-cutting coupling — `SyncStatusBar.tsx` reading `@/store` (the global Zustand store) directly for sync/auth/org state — is not a `@/modules/{x}` import and therefore doesn't violate the letter of the rule, but it does mean `core` has runtime knowledge of the app's global state shape. Documented here as an accepted, pre-existing soft coupling, not changed by this pass.

## 📝 Data Model
No schema changes — `core` owns no tables, confirmed clean on the same schema-registration check applied to all 12 other modules.

## 📝 API Contracts
- New: `registerSignOutHandler(fn)`, `signOut()` exported from `src/modules/core/utils/signOutBridge.ts`.
- Removed: `src/modules/core/utils/supabase.ts` (entire file), `Divider` component, `src/modules/core/index.ts` (entire file), the six-file Expo-template cluster and its test.
- `Header`'s props are unchanged — the sign-out wiring change is entirely internal.

## 📝 UI/UX
- No visible change to `Header`'s logout menu item — it still signs the user out identically.
- `app/+not-found.tsx` (404 screen) keeps the same text/layout, now rendered with Tamagui instead of the dead `Themed` wrapper.
- `AccordionSection` is visually and behaviorally unchanged — same press zones, same expand/collapse animation.

## 📝 Edge Cases & Failure Scenarios
| Scenario | Before | After |
|---|---|---|
| User taps "Logout" in the header menu | `Header` called `useAuth().signOut()` directly | `Header` calls the bridge's `signOut()`, which delegates to the real implementation registered at the app root — identical end-user result |
| App root hasn't mounted yet when `signOut()` is somehow called | N/A — `useAuth()` was always available wherever `Header` was rendered | Bridge warns via `console.warn` and no-ops if nothing has registered yet (should not occur in practice, since the root layout always mounts before any screen using `Header`) |
| A future developer imports `src/modules/core/utils/supabase.ts` | Would have created a second, divergent Supabase Auth client | File no longer exists — the mistake is no longer possible |
| Someone navigates to a route Expo Router can't match | 404 screen rendered via dead `Themed` components | Same 404 screen, now rendered via Tamagui |

## 📝 Risks & Impact Review
- The sign-out bridge is a small, standard dependency-inversion pattern (register-then-call) — low risk, and it happens to also deduplicate a previously-redundant `onAuthStateChange` subscription per `Header` mount down to exactly one at the app root.
- All deletions in this pass were verified to have zero call sites before removal (confirmed via repo-wide grep for each).
- The `AccordionSection` change is styling/primitive-only — its actual interaction logic (which zone does what) is completely untouched.
- **`SyncStatusBar`'s direct `@/store` dependency remains an accepted, undocumented-until-now soft coupling** — not a `@/modules/*` import, so it doesn't violate the literal rule, but it does mean `core` isn't fully model-agnostic at runtime. Recorded here for future awareness, not resolved.
- **`deleteImage` stays an open proposal**, tracked in the `inventory` spec, not duplicated or re-decided here.

## 📋 Phasing
All six fixes for this pass have already landed; no further phasing needed for `core` itself. One item remains an open, tracked proposal elsewhere:
- **(Tracked in `.ai/specs/2026-09-27-inventory-module.md`, not executed)** — wiring up or removing `deleteImage`.

## 📋 Implementation Plan (already executed)
1. Created `src/modules/core/utils/signOutBridge.ts`; updated `Header.tsx` to import `signOut` from it instead of `useAuth`; updated `app/_layout.tsx` to call `registerSignOutHandler(signOut)` from `useAuth()` in a `useEffect`.
2. Deleted `src/modules/core/utils/supabase.ts` (confirmed zero prior imports).
3. Rewrote `app/+not-found.tsx` to use Tamagui directly; deleted `Themed.tsx`, `EditScreenInfo.tsx`, `ExternalLink.tsx`, `StyledText.tsx`, `constants/Colors.ts`, `hooks/useColorScheme.ts`/`.web.ts`, `hooks/useClientOnlyValue.ts`/`.web.ts`, and `components/__tests__/StyledText-test.js`; updated `hooks/index.ts` to only export `useDirtyFlag`.
4. Deleted `Divider.tsx` and its barrel export; removed its unused (already-commented-out) import from `app/auth/register/instructor.tsx`.
5. Deleted `src/modules/core/index.ts` (confirmed its only reference was a doc-comment example, not a real import).
6. Changed `AccordionSection.tsx` to render `BaseCard` instead of a raw `Card`, with an inert `onPress` and neutralized press/hover styling to preserve exact prior behavior.

Verification: `npm run typecheck` shows the same pre-existing, unrelated error set already captured in every prior spec's verification pass — no new errors in any file touched by this pass (`Header.tsx`, `signOutBridge.ts`, `app/_layout.tsx`, `app/+not-found.tsx`, `AccordionSection.tsx`, `hooks/index.ts`, `components/index.ts`, `app/auth/register/instructor.tsx`).
