---
layout: page
feature: password-reset
title: Password reset
group: account
accent: brand
icon: key
order: 3
summary: "A person who forgot their password gets a code by email, types it in the app with a new password and signs in again."
purpose: "Gives access back without contacting the instructor or support. The email carries a **code**, not a link, so nothing has to be opened outside the app."
who:
  - role: "Anyone with an account"
    outcome: "New password, then sign in again"
rules:
  - "Starts from *Forgot password?* on the sign in screen."
  - "Needs an internet connection at every step."
  - "The code has 6–10 digits and works once. If it is wrong or expired, *Send a new code* starts over."
  - "The new password follows the sign up rules (8+ characters, A–Z, a–z, 0–9, symbol) and must differ from the old one."
  - "After the change the person signs in again with the new password. Other devices stay signed in until their session ends."
messages:
  - situation: "The email could not be sent"
    message: "Couldn't send the code. Try again."
  - situation: "Wrong or expired code"
    message: "This code is invalid or has expired. Please request a new one."
  - situation: "Password too weak"
    message: "Password is too weak. Choose a stronger password."
  - situation: "Same as the old password"
    message: "New password must be different from your current password."
  - situation: "New password not saved"
    message: "Failed to update password. Try again."
  - situation: "No connection"
    message: "No internet connection. Connect to a network and try again."
screens:
  - src: /screens/password-reset/email.png
    caption: "Forgot password"
  - src: /screens/password-reset/new-password.png
    caption: "Code and new password"
  - src: /screens/password-reset/done.png
    caption: "Password changed"
flows:
  - id: reset
    title: "Reset with a code"
    steps:
      - title: "Email"
        text: "The person types the email they signed up with and taps *Send*."
        screen: AuthForgotPassword
        api:
          - { id: auth-recover, x: 82, y: 50 }
      - title: "Email with a code"
        text: "Supabase sends the reset email. The app uses only the code in it; no `redirectTo` is sent, so the app's URL scheme does not have to be allowed in Supabase."
      - title: "Code and new password"
        text: "The code is checked first and opens a short recovery session; then the new password is saved. If saving fails, *Save* retries only the password: the code is already used."
        screen: AuthResetPassword
        api:
          - { id: auth-verify-recovery, x: 86, y: 30 }
          - { id: auth-update-user, x: 86, y: 45 }
      - title: "Check the new password"
        text: "`updateUser` answers 200 even when nothing was saved, so the app signs in with the new password to prove it works, then ends the recovery session."
        api:
          - { id: auth-sign-in-password }
          - { id: auth-logout }
      - title: "Password changed"
        text: "*Sign in* leads back to the sign in screen."
        screen: AuthResetDone
    diagram: |
      sequenceDiagram
        actor U as User
        participant A as App
        participant Auth as Supabase Auth
        U->>A: Email, Send
        A->>Auth: resetPasswordForEmail
        Auth--)U: Email with a code
        A-->>U: New password screen
        U->>A: Code + new password twice, Save
        A->>Auth: verifyOtp (recovery)
        alt wrong code
          Auth-->>A: otp_expired
          A-->>U: Invalid code
        else ok
          Auth-->>A: Recovery session
          A->>Auth: updateUser (password)
          A->>Auth: signInWithPassword (check the new password)
          A->>Auth: signOut (end the recovery session)
          A-->>U: Password changed, Sign in
        end
---

<FeatureView>

## Code

| What | Where |
| --- | --- |
| Email screen (route `/auth/forgot-password`) | `app/auth/forgot-password.tsx`, `ForgotPasswordForm.tsx` |
| Code + password (route `/auth/reset-password?email=…`) | `app/auth/reset-password.tsx`, `ResetPasswordForm.tsx`, `CodeField.tsx` |
| Done (route `/auth/reset-done`) | `app/auth/reset-done.tsx` |
| Calls and error mapping | `sendPasswordResetEmail`, `verifyRecoveryOtp`, `updatePassword` in `src/modules/auth/hooks/useAuth.ts` |
| Validation, code length | `src/modules/auth/validation/resetPasswordSchema.ts` |

## Notes

- No `redirectTo` is sent with the reset request. This avoids the app's URL scheme having to be on the Supabase redirect allow-list (otherwise Supabase falls back to `localhost:3000`).
- `updateUser` answers 200 even when no password was stored, so the app signs in with the new password before it reports success.
- The code length the app accepts (6–10) must match the OTP length set in Supabase Auth.

</FeatureView>
