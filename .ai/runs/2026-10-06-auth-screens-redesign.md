# Auth — sign in, sign up (organization / student), password reset with a code

Engine: om-auto-create-pr (steps: 8, --loop: no)

## Goal

Rebuild the sign in, sign up (account type, new organization, new student account) and password reset (forgot password, new password with the emailed code, password changed) screens on the canvas boards, using the shared `src/core/components` and design tokens.

## Brief (operator, translated)

> Auth — sign in, sign up (organization / student), password reset with a code. Based on the design, rebuild the sign in, registration and forgot password screens.

## Design source

Boards in `design/project/`:

- `AuthLogin.dc.html` — orange brand glow; 72px gradient "E" logo, "Evolync", "Sign in to your schools and notes"; EMAIL, PASSWORD (eye toggle) fields (52px, page fill, 17/700 text, focus border `#CBD5E1`); "Forgot password?" right-aligned; neutral gradient "Sign in"; bottom "No account yet? Sign up".
- `AuthLoginError.dc.html` — red alert above the fields: alert icon, "Wrong email or password", "Check both and try again. Signing in needs an internet connection the first time.", dismiss ×; the password field border turns red.
- `AuthRegisterType.dc.html` — header (back, "Sign up"); "How will you use Evolync?" / "Pick one. An instructor can still train in other schools later."; two cards: organization amber ("I run a school", chips Instructor · Owner), student blue ("I train in a school", chip Student); bottom "Already have an account? Sign in".
- `AuthRegisterOrganization.dc.html` — header "New organization"; section "Your account": FULL NAME, EMAIL, PASSWORD + rule chips, CONFIRM PASSWORD; section "Organization": ORGANIZATION NAME, FIRST SCHOOL + hint "You can add more schools later."; "Already have an account? Sign in"; pinned amber "Create"; focus border amber.
- `AuthRegisterStudent.dc.html` — header "New account"; FULL NAME (OPTIONAL), EMAIL, PHONE (OPTIONAL) with a 96px prefix button, PASSWORD + rule chips, CONFIRM PASSWORD ("Passwords don’t match" in red); info card "Next: your school code"; "Already have an account? Sign in"; pinned blue "Create".
- `AuthForgotPassword.dc.html` — header "Forgot password"; mail icon square; "We’ll email you a code" / "Enter the email you signed up with. You type the code in the next step, no link to open."; EMAIL; "Send"; bottom "Remembered it? Sign in".
- `AuthResetPassword.dc.html` — header "New password"; "Check your inbox" / "We sent a code to {email}."; CODE FROM EMAIL (64px, 26/800, letter-spaced, centered) + "6–10 digits. Not there? Check spam."; NEW PASSWORD + rule chips; CONFIRM NEW PASSWORD; "Send a new code"; pinned "Save".
- `AuthResetDone.dc.html` — green check circle, "Password changed", "Sign in with your new password. Other devices stay signed in until their session ends."; pinned "Sign in".

Password rule chips: 8+ characters · A–Z · a–z · 0–9 · Symbol @$!%*?& — met = green fill + check, unmet = outlined + empty ring.

## Scope

- Tokens: brand colors (logo gradient, page glow, logo shadow) in `src/core/theme/tokens.ts`.
- Shared (`src/core/components`): `AuthPage` (brand glow page, optional back header, pinned footer, bottom prompt) ; `TextField` gains `size="large"` (52px, page fill, 17/700), password eye toggle (`secure`), `autoComplete` / `textContentType`; `AlertBanner` (red alert with title, message, dismiss).
- `src/modules/auth`: `passwordRules.ts` (pure, tested) + `PasswordRules` chips; `AuthLogo`, `AuthPrompt`, `AccountTypeCard` (rebuilt), `CodeField`, `PhoneField`; forms rebuilt on the shared fields: `LoginForm`, `RegisterInstructorForm`, `RegisterForm`, `ForgotPasswordForm`, `ResetPasswordForm`.
- Routes `app/auth/login.tsx`, `register/index.tsx`, `register/instructor.tsx`, `register/user.tsx`, `forgot-password.tsx`, `reset-password.tsx` + new `reset-done.tsx`.
- Translation keys in en + pl; old components no longer imported (`RegisterPrompt`, `LoginPrompt`) removed.

## Non-goals

- Auth logic (`useAuth`, register services, Supabase calls, OTP flow) — behavior unchanged.
- Google sign-in (not on the boards; already commented out), `callback.tsx`, profile screen / `ProfileForm`.
- Legacy shared inputs in `src/modules/core/components` (still used elsewhere).

## Implementation Plan

### Phase 1: Shared pieces

- 1.1 Brand tokens, `AuthPage`, `AlertBanner`, `TextField` large / secure variant.
- 1.2 `passwordRules.ts` with tests + `PasswordRules`, `AuthLogo`, `AuthPrompt`, `CodeField`, `PhoneField`.

### Phase 2: Screens

- 2.1 Sign in + error banner (`LoginForm`, `login.tsx`).
- 2.2 Account type (`AccountTypeCard`, `register/index.tsx`).
- 2.3 New organization (`RegisterInstructorForm`, `register/instructor.tsx`).
- 2.4 New student account (`RegisterForm`, `register/user.tsx`).
- 2.5 Forgot password, new password, password changed (`ForgotPasswordForm`, `ResetPasswordForm`, routes + `reset-done.tsx`).

### Phase 3: Cleanup and gate

- 3.1 Remove unused auth UI and keys, en + pl complete, CLAUDE.md shared-components line, full validation gate.

## Risks

- Auth screens are the entry point; regressions block sign-in. Logic hooks are untouched, only the UI and form wiring change.
- Password rule chips derive from the same `passwordRegex` rules; the chip logic is unit-tested against the regex.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Shared pieces

- [ ] 1.1 Brand tokens, AuthPage, AlertBanner, TextField large / secure variant
- [ ] 1.2 passwordRules with tests + PasswordRules, AuthLogo, AuthPrompt, CodeField, PhoneField

### Phase 2: Screens

- [ ] 2.1 Sign in + error banner
- [ ] 2.2 Account type
- [ ] 2.3 New organization
- [ ] 2.4 New student account
- [ ] 2.5 Forgot password, new password, password changed

### Phase 3: Cleanup and gate

- [ ] 3.1 Remove unused auth UI and keys, en + pl, CLAUDE.md, full gate
