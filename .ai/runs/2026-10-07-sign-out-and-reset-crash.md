# Sign out from Profile + Android password-reset crash

## Goal

Let every user sign out of the app, and stop the Android app from closing after the password-reset email is requested so the reset can be finished.

## Scope

- Profile tab (`ProfileScreen`, `app/user/profile.tsx`): a "Log out" row under the Sign-in card, confirmed with a native alert, calling the registered sign-out handler (`signOutBridge`).
- Password reset flow (`app/auth/forgot-password.tsx` → `app/auth/reset-password.tsx`, `ResetPasswordForm`, `CodeField`): find and fix the Android crash after "Send".

Non-goals: redesigning auth screens, changing the OTP-code reset design, the web-only import cycle in `payments/services` (separate issue).

Base branch: config `baseBranch` is `auto`, which does not exist on the remote; the tracker's default branch `main` is used.

## Implementation Plan

### Phase 1: Sign out

- 1.1 Log out row on the Profile tab with confirmation (translations en/pl)

### Phase 2: Reset crash

- 2.1 Reproduce the crash on an Android emulator and fix its cause
- 2.2 Validation gate

## Risks

- Root cause (reproduced on an API 36 emulator dev build): `TextField` toggles the row opacity while disabled; Fabric flattened/unflattened the row in the same frame the screen was replaced and crashed in `addViewAt` ("View already has a parent", ReactEditText). Fixed with `collapsable={false}`; crash gone in two runs, back when reverted.
- No component-test harness exists (tests are node pure-logic only), so both changes are covered by the emulator run and manual QA, not unit tests.
- Log out not exercised at runtime (no test account on the emulator).

- The crash cannot be reproduced on the user's device; reproduction relies on the emulator dev build.

## Progress

PR: #41

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Sign out

- [x] 1.1 Log out row on the Profile tab with confirmation (translations en/pl) — c7eb230

### Phase 2: Reset crash

- [x] 2.1 Reproduce the crash on an Android emulator and fix its cause — 3d717d5
- [x] 2.2 Validation gate — 3d717d5
