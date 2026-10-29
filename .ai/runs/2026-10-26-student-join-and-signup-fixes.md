# Execution plan — Student join and instructor sign-up fixes

## Goal

A student learns in Alerts that their join request was approved and sees the new school right away; instructor sign-up either creates the account together with its organization or nothing; form validation messages follow the current language; the `handle_new_user_signup` trigger does real work again.

## Brief (user, 2026-10-26)

1. The student gets no notification on approval. "Request sent" promises "We'll let you know in Alerts", but the only join notification goes to the school owner.
2. After approval the school doesn't appear right away. The student's school list refreshes only on sign-in and app start.
3. Instructor sign-up is two calls without a transaction. If creating the organization fails, an account without an organization remains. A retry reports the e-mail as taken, and after signing in the student dashboard opens.
4. Form validation messages don't change language. Zod schemas translate at import, so they stay in the language of app start (Polish "Hasła się różnią" in the English student sign-up).
5. The `handle_new_user_signup` trigger is dead: the app no longer sends the organization name in metadata.

## Scope

- **1 — approval notification:** new notification type `join_request_approved`, created by an AFTER trigger on `school_members` (the requester's member row becomes active, a join request for that user + school exists). Client: type, payload, inbox text, deep link (student dashboard of that school), audience, translations, push template.
- **2 — school appears right away:**
  - Sync edge function (`sync-user.ts`): when the user's own membership was created or changed since the last pull, school-scoped tables are pulled in full once (a newly joined school's old rows — the school, settings, cycles, members, events — are otherwise older than `lastPulledAt` and never arrive).
  - Client: a root-level watcher observes the user's active `school_members` rows in WatermelonDB (with their school present locally) and adds new memberships to the store and its cache, so the dashboard shows the school after the next sync (foreground / interval) without restart.
- **3 + 5 — atomic instructor sign-up:** `handle_new_user_signup` again creates the organization, default roles and first school from sign-up metadata — inside the `auth.users` insert transaction, so a failure leaves no account. The client sends `organization_name` / `school_name` in `signUp` metadata and no longer calls the RPC in the normal path. Recovery for accounts already left without an organization: when sign-up says the e-mail is taken, the app signs in with the given password and, if that account owns no organization, completes the setup through `setup_instructor_organization`.
- **4 — localized validation:** `localizedSchema(build)` in `src/core/utils` (a `z.lazy` rebuilt per language) used by every validation module that calls `t()`; React Hook Form forms re-validate shown errors when the language changes.

## Non-goals

- Deploying the migrations or the `sync` edge function to production (owner action).
- Notifying the student about rejection (the dashboard already shows the rejected card).
- Push-triggered sync on notification receipt.
- Reworking translations outside `validation/` folders.

## Decisions

- Revive the trigger (not drop it): it is the only place where account creation and organization setup can share one transaction without moving sign-up server-side; this also resolves item 5.
- The approval notification fires from `school_members`, not from the join request soft-delete: the member row is what makes the student part of the school, and both approval modes (new member / activate offline member) produce it.
- The full school-scoped pull reruns whenever the user's own member row changes (e.g. profile or rank update) — one heavier sync in a rare case, in exchange for not tracking which schools a device already has.

## Implementation Plan

### Phase 1: Approval notification
1.1 Migration: `join_request_approved` type + `notify_join_request_approved` trigger on `school_members`; SQL test.
1.2 Client type, payload, content, route, audience, translations, push template; tests.

### Phase 2: School appears right away
2.1 Sync: full pull of school-scoped tables after a membership change; Deno test.
2.2 Client membership watcher (pure merge helper + hook mounted at root); tests.

### Phase 3: Atomic instructor sign-up
3.1 Migration: `handle_new_user_signup` creates organization, roles and school from metadata; SQL test.
3.2 Client: metadata sign-up, recovery for orphaned accounts; tests.

### Phase 4: Localized validation messages
4.1 `localizedSchema` helper + test.
4.2 Convert validation modules to `localizedSchema`.
4.3 Re-validate shown form errors on language change.

## Risks

- Deploy order: the previous `handle_new_user_signup` already reads the same `organization_name` / `school_name` metadata keys, so an app build that ships before the migration still gets its organization (only without the clean rollback). If the remote trigger was dropped by hand, the recovery path completes the account on the next sign-up attempt.
- Deploy: two migrations (`20261026000000`, `20261026000100`, above the remote's latest `20261016000100`), the `sync` and `send-push` edge functions.
- Deno and SQL tests run through Docker (`run-deno-tests.sh`, `run-sql-tests.sh`).

## Progress

PR: #63

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Approval notification

- [x] 1.1 Migration: approval notification trigger + SQL test — 54c7537
- [x] 1.2 Client type, content, route, translations, push template — 02eef77

### Phase 2: School appears right away

- [x] 2.1 Sync: full pull of school-scoped tables after a membership change — 2819b8a
- [x] 2.2 Client membership watcher — 1998757

### Phase 3: Atomic instructor sign-up

- [x] 3.1 Migration: sign-up trigger creates the organization — 7ae0535
- [x] 3.2 Client: metadata sign-up and orphaned-account recovery — 0120911

### Phase 4: Localized validation messages

- [x] 4.1 localizedSchema helper — 9478ac7
- [x] 4.2 Convert validation modules — a8c4606
- [x] 4.3 Re-validate shown errors on language change — 14b0031
