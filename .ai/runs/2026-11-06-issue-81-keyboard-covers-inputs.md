# Execution plan — issue-81-keyboard-covers-inputs

Issue: #81 — keyboard covers inputs at the bottom of a form (e.g. variant stock)

## Goal

On Android (edge-to-edge) and iOS, the focused input of a form scrolls above the keyboard and the pinned Save / Create footer stays on top of it.

## Scope

- Root cause: `SubScreenPage`, `TabPage` and `AuthPage` used `KeyboardAvoidingView` with `behavior: undefined` on Android; with `edgeToEdgeEnabled` the window is never resized, so nothing moved the content. `FormSheet` `fill` (92%) used Tamagui `moveOnKeyboardChange`, which clamps at the top of the screen and leaves the bottom under the keyboard.
- Fix in the shared page components (every form benefits): `react-native-keyboard-controller` (`KeyboardProvider`, `KeyboardAwareScrollView`, `KeyboardStickyView`, `useKeyboardState`).
- Decision (issue open question, default taken autonomously): the native dependency is accepted; it needs a new dev/EAS build and changes the fingerprint.

Non-goals: no visual redesign of forms; keyboard not opening on screen entry (#80); inputs low inside a `fill` sheet's own scroll view (none exist today).

## Implementation Plan

### Phase 1: Keyboard-aware pages

1. Add `react-native-keyboard-controller` 1.18.5 (Expo-expected) and wrap the app in `KeyboardProvider` outside the portal.
2. `SubScreenPage`, `TabPage`, `AuthPage`: `KeyboardAwareScrollView` with `bottomOffset` = measured footer height + 16; footer in `KeyboardStickyView` (`offset.opened = insets.bottom`).
3. `FormSheet` `fill`: no `moveOnKeyboardChange`; bottom padding = keyboard height + 12 while open.
4. Regression test (`keyboardAwarePages.test.ts`), observed failing on the old code before the fix.

## Risks

- Native dependency: OTA updates do not reach builds without it; needs a new dev/EAS build.
- Device behavior is verified only structurally by tests; manual QA on Android and iOS is required (variant Stock, last Profile field, Add product).
- Minor (review): the `fill` sheet padding follows the keyboard at the end of its animation, not during it.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Keyboard-aware pages

- [x] 1.1 Add react-native-keyboard-controller and KeyboardProvider — 97672c0
- [x] 1.2 Keyboard-aware scroll and sticky footer in the page components — 43c866b
- [x] 1.3 FormSheet fill makes room for the keyboard — 50c3290
- [x] 1.4 Regression test for keyboard-aware pages and fill sheet — bddae25
