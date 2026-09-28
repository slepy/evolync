# Events Module — Specification (as-built + remediation)

## 📝 TLDR
Documents current behavior of `src/modules/events/` — one-off scheduled happenings (distinct from `attendance`'s recurring training sessions), with 3-level visibility (`organization`/`school`/`whitelist` — the whitelist is just `event_participants` rows themselves, no separate table), a 3-way participant status (`absent → attending → paid`) gated so only instructors can set `paid`, and cash-only bookkeeping fully independent of the `payments` module. No schema/migration bug was found here (unlike `payments`/`orders`/`inventory`) — schema registration and Postgres migration timing both check out cleanly. Four independently shippable fixes are proposed for gaps found in soft-delete filtering, write atomicity, edit-time validation, and student-list reactivity. Event pricing is confirmed fixed-per-event by design — no per-participant price snapshot is needed or proposed.

## 📝 Problem Statement
- `EventRepository.findByIds` omits the `deleted_at` filter present on every other query method in the same file — a soft-deleted event can still be hydrated into a student's event list (`useStudentEvents`, which only filters `status === 'cancelled'`, not `deletedAt`).
- `bulkSaveParticipantStatuses` and `useStudentEventStatuses.saveAll` loop independent single-record writes (sequential `await` / `Promise.all` respectively) instead of one atomic transaction — the same non-atomic pattern already fixed in `attendance`, `payments`, and `orders`.
- `updateEventSchema` doesn't re-run the cross-field rules `createEventSchema` enforces (`schoolId` required when visibility is `school`; `whitelistedMemberIds` non-empty when visibility is `whitelist`) — an edit can silently produce an invalid combination that only a thinner service-layer check partially catches (school-only, no whitelist check at all).
- `useStudentEvents` is a one-time fetch, not a live `.observe()` subscription, unlike `useEvents`/`useEventParticipants` elsewhere in the same module — a student's own events list won't update reactively without a screen remount.

## 📝 Proposed Solution
Four independently shippable fixes:

1. **Filter soft-deleted events from `findByIds`** — add `Q.where('deleted_at', null)` to match every other query method in `EventRepository`, so a soft-deleted event can no longer surface in a student's list via this path.
2. **Batch participant-status bulk saves** — rewrite `bulkSaveParticipantStatuses` and `useStudentEventStatuses.saveAll` to build one `database.batch()` of `prepareUpdate` operations inside a single `database.write()`, mirroring the fix already specified for `attendance`/`payments`/`orders`. Either fully commits or fully fails.
3. **Re-validate cross-field rules on edit** — apply the same `schoolId`-required-for-`school`-visibility and `whitelistedMemberIds`-non-empty-for-`whitelist`-visibility refinements to `updateEventSchema` that `createEventSchema` already has, so an edit can't produce an inconsistent visibility/target combination that create-time validation would have blocked.
4. **Make the student's event list reactive** — switch `useStudentEvents` from its one-time-fetch (`hasLoaded` ref guard) to an `.observe()`-backed subscription on `EventParticipantRepository`/`EventRepository`, matching the rest of the module's reactive pattern.

**Confirmed as intentional, not changed by this spec**: event price/currency is fixed per event by design, not per participant — editing an event's price after some participants are marked `paid` intentionally applies retroactively to everyone; no per-participant price snapshot is needed. This resolves the open design question the module's PRD had left unresolved.

## 📝 Architecture
No new modules or cross-module dependencies. All four fixes are internal to `events`' own repository/service/hook layer.

## 📝 Data Model
No schema changes. Fix #1 is a query-filter change; fix #3 is validation-only; fixes #2 and #4 change transaction/subscription shape, not stored data.

## 📝 API Contracts
No public contract changes. Fix #3 makes `updateEventSchema` throw in cases it previously accepted (an edit producing `visibility: 'school'` with no `schoolId`, or `visibility: 'whitelist'` with an empty list) — a stricter but corrective validation surface.

## 📝 UI/UX
- Fix #1, #2, #4: no visible UI change — correctness/consistency fixes underneath existing screens.
- Fix #3: an instructor attempting to save an edit that would leave an event in an invalid visibility/target state now sees the same validation error create-time already shows, instead of the edit silently succeeding.

## 📝 Edge Cases & Failure Scenarios
| Scenario | Current behavior | Behavior after this spec |
|---|---|---|
| Event soft-deleted while a student's device has it cached | Can still surface in the student's event list via `findByIds` | No longer surfaces (fix #1) |
| Bulk participant-status save fails partway | Some participants updated, some not, no rollback | Batch fully commits or fully fails (fix #2) |
| Instructor edits an event, clears the whitelist while visibility stays `whitelist` | Silently saved, event now has all-and-none semantics | Throws a validation error before saving (fix #3) |
| Student's device has the events screen open while participation changes elsewhere | Stale until remount | Updates live (fix #4) |
| Instructor changes an event's price after participants are marked paid | Applies retroactively to all participants, no historical record | Unchanged — confirmed intentional (fixed price per event) |

## 📝 Risks & Impact Review
- Fixes #1–#4 are low blast radius, no schema change, fully reversible.
- Fix #2's batching touches the one call site (`useStudentEventStatuses.saveAll`) that's also affected by the still-outstanding `isInstructor: true` wiring fix already proposed in `.ai/specs/2026-09-26-students-module.md` (Fix #4) — that fix has not yet been implemented in code (specs propose changes, they don't auto-apply them); whoever implements either fix should check the other hasn't landed first to avoid redundant/conflicting edits to the same function.
- Fix #3 is stricter validation — confirm no existing production event data already violates these rules before enabling strict edit-time enforcement (a pre-existing `school`-visibility event with a null `schoolId`, if any exist, would become un-editable without first fixing its visibility or school assignment).

## 📋 Phasing
Each fix ships independently:
- **Fix #1** — Filter soft-deleted events from `findByIds`.
- **Fix #2** — Batch participant-status bulk saves.
- **Fix #3** — Re-validate cross-field rules on edit.
- **Fix #4** — Make the student's event list reactive.

## 📋 Implementation Plan

1. Add `Q.where('deleted_at', null)` to `EventRepository.findByIds`. Test: a soft-deleted event's id passed to `findByIds` returns no result; a student's event list no longer includes it.
2. Rewrite `bulkSaveParticipantStatuses` (service) and `useStudentEventStatuses.saveAll` (hook) to build a `database.batch()` of `prepareUpdate` calls inside one `database.write()`. Test: inject a failure partway through a multi-participant save — assert zero participants changed, not a partial subset.
3. Add the same `schoolId`-required / `whitelistedMemberIds`-non-empty refinements from `createEventSchema` to `updateEventSchema`. Test: editing an event to `visibility: 'whitelist'` with an empty list throws before saving; editing to `visibility: 'school'` with no `schoolId` throws before saving.
4. Convert `useStudentEvents` from its one-time fetch to an `.observe()`-backed subscription. Test: with the student's events screen open, an instructor changing that student's participation status elsewhere updates the open screen without a remount.
