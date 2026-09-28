# Organization & School Modules — Specification (as-built + remediation)

## 📝 TLDR
Documents current behavior of `src/modules/organization/` (org-level dashboard only — org creation/read is entirely owned by the `auth` module's `setup_instructor_organization` RPC, no repository/service of its own here) and `src/modules/school/` (schools, invite codes, join requests, school settings). Approve/reject of join requests and the `SchoolMember` model live in the `students` module — out of scope here, referenced but not redesigned. Three independently shippable fixes are proposed: an owner-only route guard, cryptographically-sound invite codes, and a "Rejected" status on the student's pending-join card (extends the card the `auth` spec's Fix #3 already adds). One architectural question is deliberately **not resolved** in this pass and is carried forward as an open decision (see below) rather than defaulted, because it changes a stated project-wide principle.

## ⚠️ Decision needed (not resolved by this spec)
**Offline-first sync vs. targeted direct reads.** CLAUDE.md mandates "All reads/writes go through local WatermelonDB — never directly from Supabase" (except `auth.*`, `storage.*`, named `rpc()`, sync edge function). In practice, three places already bypass this (`SchoolRepository.findByIdOrFetchFromSupabase`, three calls inside `joinSchoolService.ts`, and `useAuth.ts`'s `syncSchoolMembership`) — arguably because syncing *every* school/membership/invite row to *every* device unconditionally, just so an occasional single-record lookup can be served locally, pulls down data most devices never need (a school a user isn't a member of, invites for schools they don't manage, etc.).

This is a genuine architecture trade-off, not a bug:
- **Sync everything (current stated principle):** simplest mental model, works fully offline, but grows each device's local DB with data it may never use, and this spec's remediation would need to make `WatermelonDB` sync scope-aware (e.g., sync only schools/orgs the user is a member or owner of) rather than fixing the symptom by adding more direct reads.
- **Targeted direct reads for specific, infrequent lookups (current de facto behavior in 3 places):** keeps local storage lean, but breaks offline-first for those specific lookups, and quietly erodes the "one clear rule" architecture CLAUDE.md documents — each new "exception" needs its own justification and won't be obvious to the next engineer reading CLAUDE.md's rule as absolute.

**This spec does not pick a side.** It documents the 3 existing violations as-is (Risks section) and proposes no code change for them. Both resolution shapes are options once someone decides — accepting the exceptions permanently and naming them in CLAUDE.md, or redesigning the sync payload to be scoped per-user so the exceptions are no longer needed — but this document takes neither position. Until that decision lands, treat the three direct-read call sites as a known, deliberate exception, not a queue of independent bugs to fix ad hoc.

## 📝 Problem Statement
No specification exists for `organization`/`school` today. Reading the code surfaced:
- No client-side authorization guard on any owner-only screen (`/organization/*`, `/school/*` management) — reachable by URL by any logged-in user regardless of role, relying entirely on unverified server-side RLS.
- Invite codes are generated with `Math.random()` (not cryptographically secure), 6 base-36 characters, no collision check.
- A student who submits a join request that gets rejected has no visibility into that outcome and can immediately resubmit with no cooldown.
- Module-boundary drift: `organization/database/schema.ts` still owns tables (`school_members`, `orders`, `payment_cycles`, …) that belong to other modules per its own code comments; `organization/validation/index.ts` re-exports the grading module's schema; approve/reject logic for a `school`-owned join request lives in `students`, not `school`.
- The `get_organization` RPC sketched in `.ai/organization-dashboard/api-plan.md` was never implemented — current org state comes from the auth module's Zustand/WatermelonDB caching instead. The plan doc is stale relative to the code.

## 📝 Proposed Solution
Fixes #1 and #2 are fully independent — either ships alone with no dependency on the other or on any other spec. Fix #3 splits in two: its data-model half (the `status` column + `markRejected`) is independent, but its UI half is a **hard prerequisite dependency** on the "Pending approval" card the `auth` spec's Fix #3 builds — there is nothing to extend if that card doesn't exist yet. Fix #3's UI half cannot ship before the `auth` spec's Fix #3 lands; this is a blocking order, not a soft sequencing preference.

1. **Owner-only route guard** — add a lightweight `useRequireOrganizationOwner()` guard (checked against the already-cached `useStore().organization`) to every screen under `app/organization/*` and the management screens under `app/school/*` (create, settings, students, generate-invite), redirecting to `/` if the current user has no organization. This is defense-in-depth on top of RLS, not a replacement for it — RLS remains the actual authorization boundary; this only prevents a confusing client-side UI state for a student who navigates to an owner screen by URL.
2. **Cryptographically-sound invite codes** — replace `Math.random().toString(36)...` in `inviteService.ts:21` with `expo-crypto`'s `getRandomBytes` (already an Expo-ecosystem dependency, no new package) mapped to the same 6-character base-36/uppercase alphabet, plus a pre-insert collision check against `SchoolInviteRepository` for the target school (local WatermelonDB query only — no new direct Supabase call).
3. **"Rejected" status on the student's join-request card** — extends the "Pending approval" card the `auth` spec's Fix #3 introduces on the student dashboard (observing `school_join_requests`), so a rejected request's soft-delete is instead surfaced first as a dismissible "Rejected" card before the record disappears. Requires `rejectJoinRequest` (`studentService.ts`) to stop hard-soft-deleting immediately and instead set a `status`-equivalent marker the student-facing observe query can distinguish — see Data Model below for the smallest schema change this needs. No re-request cooldown is introduced (kept a separate, undecided product question — a rejected student can still resubmit).

**Not changed by this spec** (documented as-is): the three direct-Supabase-read call sites (see Decision above), the `organization`/`school`/`students` module-boundary drift, the stale `get_organization` RPC doc, and school-deletion/ownership-transfer (no UI or flow exists — flagged below as a future-spec candidate, not built now).

## 📝 Architecture
- `organization` module: dashboard UI + one hook (`useOrganizationDashboard`) aggregating pending-order counts across the org's schools. No repository/service of its own — organization creation/read is owned entirely by `auth`'s RPC + Zustand cache.
- `school` module: owns `School`, `SchoolInvite`, `SchoolJoinRequest`, `SchoolSettings` — full repository + service layer, mostly CLAUDE.md-compliant (see Risks for the 1 remaining exception under the Decision above).
- `students` module (not respecified here): owns `SchoolMember` and the approve/reject business logic for a join request that was created in `school`. This is a real cross-module coupling: a `school`-owned record's lifecycle is resolved by code in a different module. Documented as current architecture, not changed here — will be covered fully when the `students` module spec is written.
- Fix #1 adds a thin guard hook in `organization`/`school`'s shared UI layer (no new module).
- Fix #3 requires `school`'s `SchoolJoinRequestRepository` to expose an `observeBySchoolAndUserId`-style query the `auth` spec's dashboard card (built in the `auth`/`students` boundary) already needs — coordinate with the `auth` spec's Fix #3 implementation, do not duplicate the observe method.

## 📝 Data Model
- No changes for Fixes #1–#2.
- Fix #3 needs one field: add `status: 'pending' | 'rejected'` (default `'pending'`) to `school_join_requests` (currently the row's existence alone means pending; a soft-delete is the only "resolved" signal). Migration: additive column with a default, backward compatible — existing rows backfill to `'pending'` on read if the column is null (no destructive migration required). `rejectJoinRequest` sets `status = 'rejected'` instead of soft-deleting immediately; the row is soft-deleted later (e.g., when the student dismisses the "Rejected" card, or on a TTL — left to implementation, not a hard requirement here).

## 📝 API Contracts
No public/API contract changes. Internal repository surface addition: `SchoolJoinRequestRepository` gets an `observeBySchoolAndUserId(schoolId, userId)` (or reuses `auth`'s planned method if scope allows — see Architecture) and a `markRejected(id)` mutation alongside the existing soft-delete.

## 📝 UI/UX
- Fix #1: no new UI — invisible redirect for unauthorized navigation attempts.
- Fix #2: no UI change — invite code generation is unchanged from the user's perspective.
- Fix #3: student dashboard's pending-join card (from the `auth` spec) gains a second visual state ("Rejected", dismissible) instead of silently disappearing.

## 📝 Edge Cases & Failure Scenarios
| Scenario | Current behavior | Behavior after this spec |
|---|---|---|
| Student manually navigates to `/school/[id]/settings` URL | Screen renders (relies on RLS to block actual data mutation) | Redirected before render (fix #1) |
| Instructor regenerates invite code twice offline, then syncs | Two "active" invites can briefly coexist (client-side "one active invite" rule not enforced server-side) | Unchanged — out of scope, still a known race (see Risks) |
| Invite code guessed/brute-forced | Low but non-zero risk (`Math.random()`, 6 chars) | Cryptographically random generation + collision check (fix #2) |
| Student's join request rejected | Row soft-deleted silently; student sees nothing, can resubmit anytime | Student sees a dismissible "Rejected" card; can still resubmit (no cooldown — deliberate, unresolved) |
| Duplicate join request submitted while offline | Guard skipped (Supabase-dependent check), duplicate row created, reconciled only implicitly at next sync | Unchanged — out of scope |

## 📝 Risks & Impact Review
- **Sync-scope decision (see Decision above) left open** — the three direct-Supabase-read sites remain as documented exceptions; revisit once the offline-sync-scope architecture question is settled.
- **Module-boundary drift** (`organization/database/schema.ts` owning other modules' tables, `organization/validation/index.ts` re-exporting grading's schema, join-request lifecycle split across `school`/`students`) — documented, not fixed here; a larger refactor, out of scope for this pass.
- **No school-deletion or organization-ownership-transfer flow** — `SchoolRepository.softDelete` exists but is called from nowhere; no UI. Flagged as a **future-spec candidate** (like password reset was for `auth`), not designed further here.
- **Stale `.ai/organization-dashboard/api-plan.md`** describes a `get_organization` RPC that was never built — should be marked stale/superseded in that doc (housekeeping, not a code risk).
- Fixes #1–#3 are low blast radius: #1 and #2 touch no schema; #3's additive column is backward compatible and reversible (drop column / ignore it).

## 📋 Phasing
- **Fix #1** — Owner-only route guard. Independent, ship anytime.
- **Fix #2** — Cryptographically-sound invite codes. Independent, ship anytime.
- **Fix #3, data half** — `status` column + `markRejected`. Independent, ship anytime.
- **Fix #3, UI half** — "Rejected" card. **Blocked** until the `auth` spec's Fix #3 (the "Pending approval" card) has shipped — this is a hard prerequisite, not a scheduling preference.
- **(Future, not designed here)** — School deletion / organization-ownership transfer.

## 📋 Implementation Plan

1. Add `useRequireOrganizationOwner()` hook (checks `useStore().organization !== null`, redirects to `/` otherwise); wire it into every screen under `app/organization/*` and the owner-only screens under `app/school/*` (`create`, `[schoolId]/settings`, `[schoolId]/students/*`, `[schoolId]/students/generate-invite`). Test: a student-only session hitting any of these routes directly is redirected before the screen's data-fetching hooks run.
2. Replace `Math.random()`-based code generation in `inviteService.ts` with `expo-crypto`'s `getRandomBytes`-backed generation; add a pre-insert collision check against `SchoolInviteRepository.findByCode` scoped to the school before creating the new invite (retry generation on collision, capped at a few attempts). Test: generate 1000 codes, assert format/length invariants hold and no collision-retry path throws.
3. Add `status` column (`pending | rejected`, default `pending`) to `school_join_requests` schema + a WatermelonDB migration; update `SchoolJoinRequestRepository` with `markRejected(id)`; update `rejectJoinRequest` (`studentService.ts`) to call `markRejected` instead of immediate soft-delete. Test: rejecting a request leaves the row queryable with `status: 'rejected'` until explicitly dismissed/soft-deleted.
4. Extend the student dashboard's pending-join observe query/card (built by the `auth` spec's Fix #3) to render a second visual state when `status === 'rejected'`, with a dismiss action that soft-deletes the row. Test: end-to-end — submit join request → instructor rejects → student sees "Rejected" card → dismiss removes it from the list.
