# Execution plan — Create / Save buttons behind the Android navigation bar

## Goal

Primary buttons (Create / Save) at the bottom of forms and sheets, and the last rows of long scrolling screens, never sit behind the Android system navigation bar.

## Brief (user, 2026-11-04)

"czasami guzik create lub save w formularzach chowa sie za guzikami androida, i brzydko to wyglada (szczegolnie przy dlugich formularzach) znajdz te miejsca i popraw" — the Create / Save button of forms sometimes hides behind the Android buttons, especially on long forms; find those places and fix them.

## Findings

- The app runs edge-to-edge on Android (`app.json` `edgeToEdgeEnabled: true`), so content draws under the navigation bar: the 3-button bar is ~48dp, gesture navigation ~16–24dp ("sometimes").
- Page footers (`SubScreenPage`, `TabPage`, `AuthPage` with `footer`) already sit in a `SafeAreaView` with the bottom edge — fine.
- Bottom sheets ignore the bottom inset: `FormSheet` (every form sheet: Add product, Approve request, Rank, Tag, Event type, Payment amount, Save technique / preset…) pads 36px (28px for tall `fill` sheets), `PushPermissionPrompt` and `ContextSheet` 32px. With the 3-button bar the primary button lands under it; tall sheets are the worst.
- Scrolling screens without a footer (`SubScreenPage`, `TabPage`, `DashboardPage` without the nav) pad the scroll content by 40px only, so the last row / "Add new" of a long list scrolls to a stop behind the bar.

## Scope

- Pure helper `bottomInsetPadding(base, insetBottom)` in `src/core/utils/safeArea.ts` (unit tested): the design padding, raised to the system inset plus a 16px gap when the inset is larger.
- `FormSheet`, `PushPermissionPrompt`, `ContextSheet`: bottom padding from the helper and `useSafeAreaInsets()`.
- `SubScreenPage`, `TabPage`, `DashboardPage`: scroll content bottom padding adds the bottom inset when there is no footer / nav.

## Non-goals

- Keyboard handling on Android (`KeyboardAvoidingView` behavior) — separate issue.
- Moving form buttons between sheets and pages, or redesigning any screen.
- The 3D scene panel (`SceneScreen` already adds the inset).

## Decisions

- Base branch: the config names `auto`, which does not exist on the remote; the PR targets `main` (repository default).
- `max(base, inset + 16)` rather than `base + inset`: on devices without a bar (or iOS with the home indicator) the sheets keep their designed spacing instead of growing.

## Implementation Plan

### Phase 1: Helper

1.1 `bottomInsetPadding` in `src/core/utils/safeArea.ts` with unit tests.

### Phase 2: Sheets and pages

2.1 Sheets (`FormSheet`, `PushPermissionPrompt`, `ContextSheet`) pad above the navigation bar.
2.2 Scrolling pages without a footer (`SubScreenPage`, `TabPage`, `DashboardPage`) keep the last row above the navigation bar.

### Phase 3: Validation

3.1 Full validation gate (`npm run typecheck`, `npm run check:theme`) and the unit tests.

## Risks

- A sheet open over the keyboard keeps the extra inset padding above the keyboard (the bar is still there under the keyboard on Android); small visual cost, no overlap.
- Not verified on a physical Android device in this run.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Helper

- [ ] 1.1 bottomInsetPadding helper with unit tests

### Phase 2: Sheets and pages

- [ ] 2.1 Sheets pad above the navigation bar
- [ ] 2.2 Scrolling pages keep the last row above the navigation bar

### Phase 3: Validation

- [ ] 3.1 Full validation gate
