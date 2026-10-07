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

- The crash cannot be reproduced on the user's device; reproduction relies on the emulator dev build.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Sign out

- [ ] 1.1 Log out row on the Profile tab with confirmation (translations en/pl)

### Phase 2: Reset crash

- [ ] 2.1 Reproduce the crash on an Android emulator and fix its cause
- [ ] 2.2 Validation gate
