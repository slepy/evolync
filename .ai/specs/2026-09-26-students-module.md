# Students Module — Specification (as-built + remediation)

> **Status (2026-09-30):** All five fixes are implemented and live on `main` (commit `2c81b92`, landed the same day this spec was authored — the remediation shipped directly alongside the as-built documentation rather than through a separate PR). Verified by direct code inspection: `approveJoinRequest` (`src/modules/students/services/studentService.ts`) reads `SchoolSettingsRepository.findBySchoolId` for `defaultCurrency`/`defaultPaymentAmount` (falling back to `0`/`"PLN"` only when no settings row exists) and throws `existingMemberNotEligible` when `existingMemberId` doesn't belong to the school or isn't `OFFLINE`; `StudentRepository.findOfflineBySchoolId` exists and is what `ApproveJoinRequestSheet.tsx` uses for its candidate picker; the same component's auto-match normalizes email (trim + lowercase) and phone (via `formatPhoneNumber`/`parsePhoneNumber`) before comparing; the instructor's student-detail screen (`app/school/[schoolId]/students/[studentId]/index.tsx`) passes `{ isInstructor: true }` to `useStudentEventStatuses` (the student self-service screen at `app/user/events.tsx` correctly passes `{ isInstructor: false }`); and `useStudentPayments`/`useStudentAttendance` both subscribe via `.observe()` (`observeByMemberId`) while preserving pending local edits across live updates.

## 📝 TLDR
Documents current behavior of `src/modules/students/` — the `SchoolMember` model/repository, shadow-student CRUD, and the approve/reject-join-request flow (the business-logic half of the `school`-owned join request). Five independently shippable fixes are proposed for concrete data-integrity and wiring bugs found in `approveJoinRequest`, the join-request picker, and the instructor's event-status view. A student self-service view of their own rank/status is flagged as a future-spec candidate, not designed here.

## 📝 Problem Statement
- `approveJoinRequest` hardcodes `amount: 0, currency: "PLN"` when enrolling a newly approved member into payment cycles, ignoring the school's actual `default_currency`/`default_payment_amount` (`school_settings`, already modeled in the `school` module) — silently wrong for non-PLN schools.
- `approveJoinRequest` trusts a client-picked `existingMemberId` with no check that it belongs to the target school or is actually a shadow (`OFFLINE`) member; the picker itself is fed by `findBySchoolId`, which applies no status filter, so archived or already-active members can appear as "existing student" candidates.
- The email/phone auto-match in `ApproveJoinRequestSheet` is a naive case-sensitive, untrimmed, non-canonicalized string comparison — mismatches silently create duplicate members instead of linking to the right shadow student.
- The instructor's student-detail screen calls `useStudentEventStatuses` without `isInstructor: true`, so the instructor gets the student's 2-way toggle instead of the documented 3-way (absent → attending → paid) cycle — a wiring bug.
- Payments/attendance data on the student detail screen are one-time fetches, not `.observe()`, unlike the rest of the offline-first architecture — stale if edited concurrently elsewhere (e.g., attendance marked from a training-session screen while the student detail screen is open).

## 📝 Proposed Solution
Five independently shippable fixes — none depends on another:

1. **Correct payment-cycle enrollment amount/currency** — `approveJoinRequest`'s `PaymentRecordRepository.bulkCreate` call reads the school's `SchoolSettings` (`default_currency`, `default_payment_amount`) instead of hardcoding `0`/`"PLN"`. Falls back to `0`/`"PLN"` only if the school has no settings row yet (documented existing edge case, not introduced by this fix).
2. **Validate and scope the "existing member" match** — two changes: (a) `approveJoinRequest` verifies server-side that `existingMemberId` (when provided) belongs to `schoolId` and has `status: OFFLINE` before overwriting it, throwing a clear error otherwise; (b) `ApproveJoinRequestSheet`'s picker switches from `findBySchoolId` (unfiltered) to a new `StudentRepository.findOfflineBySchoolId` (status `OFFLINE` only), so the UI can only ever offer true shadow-student candidates.
3. **Normalize email/phone matching** — the auto-match in `ApproveJoinRequestSheet` lowercases + trims email before comparing, and compares phone numbers via the same canonicalization already used by `formatPhoneNumber` at creation time (so historical formatting drift doesn't cause silent duplicates going forward; already-duplicated historical records are not backfilled by this fix).
4. **Fix instructor event-status wiring** — pass `{ isInstructor: true }` to `useStudentEventStatuses` on the instructor-facing student-detail screen, restoring the documented 3-way cycle.
5. **Make payments/attendance detail views reactive** — `useStudentPayments`/`useStudentAttendance` switch from one-time fetch to `.observe()` subscriptions on `PaymentRecordRepository`/attendance repository, matching the rest of the module's reactive pattern. Local pending-edit state (`updateLocal`/`saveAll`) is preserved — only the initial/underlying data source becomes reactive, not the edit-buffer semantics.

**Not changed by this spec** (documented as-is, future-spec candidate): a student self-service view of their own rank, join date, and membership status does not exist anywhere in the app today. Flagged for a future spec once scheduled, not designed here — mirrors how password reset was carried forward in the `auth` spec.

## 📝 Architecture
- `students` owns `SchoolMember` (model + repository + service) and the approve/reject business logic for a `school`-owned `SchoolJoinRequest` — this cross-module coupling (already documented in the `organization`/`school` spec) is unchanged by this spec.
- Fix #1 reads `school`'s `SchoolSettingsRepository` from `students`'s service layer — an existing cross-module read pattern (already used elsewhere for school-scoped lookups), not a new dependency direction.
- Fix #5 changes `useStudentPayments`/`useStudentAttendance` (owned by `payments`/`attendance` modules respectively, consumed by `students`) — implementation happens in those modules' hooks, but is scoped and driven by this spec since the student detail screen is the concrete symptom. Coordinate file ownership with whoever implements it; no new module boundary is created.

## 📝 Data Model
No schema changes. Fix #2 adds one repository method (`StudentRepository.findOfflineBySchoolId`, a `Q.where('status', 'offline')` variant of existing `findBySchoolId`) — no migration needed.

## 📝 API Contracts
No public contract changes. Internal signature change: `approveJoinRequest` now throws a new error case (`existingMemberNotEligible` — wrong school or not OFFLINE) in addition to the existing `joinRequestNotFound`.

## 📝 UI/UX
- Fix #1, #2(a), #3: no visible UI change — correctness fixes underneath existing flows.
- Fix #2(b): the "existing student" picker in `ApproveJoinRequestSheet` shows fewer (correct) candidates — archived/active members no longer appear.
- Fix #4: instructor now sees the 3-way event status cycle (absent → attending → paid) on the student detail screen's Events tab, where they previously only saw 2-way.
- Fix #5: no visible UI change in the common case; a concurrent edit elsewhere now reflects live instead of requiring a remount.

## 📝 Edge Cases & Failure Scenarios
| Scenario | Current behavior | Behavior after this spec |
|---|---|---|
| Approve join request into payment cycle, school currency ≠ PLN | Payment record created with wrong currency/amount silently | Reads school's actual default currency/amount (fix #1) |
| Caller passes an `existingMemberId` from a different school | Silently overwrites that member's identity, flips to ACTIVE | Throws `existingMemberNotEligible` (fix #2a) |
| Picker offers an already-ACTIVE or ARCHIVED member as "existing shadow student" | Possible today (`findBySchoolId` unfiltered) | Picker only shows OFFLINE members (fix #2b) |
| Student's email differs only by case/whitespace from a shadow record | No auto-match, duplicate member created | Auto-match succeeds (fix #3) |
| Instructor toggles event status for a student | Only absent↔attending (paid unreachable) | Full 3-way cycle including paid (fix #4) |
| Attendance marked elsewhere while student detail screen is open | Detail screen stays stale until remount | Reflects live (fix #5) |
| School has no `SchoolSettings` row yet, approve into a payment cycle | N/A today (hardcoded regardless) | Falls back to `0`/`"PLN"` — same as today, only reached when settings are genuinely absent |

## 📝 Risks & Impact Review
- **Fix #3 does not backfill already-duplicated historical members** created by prior mismatches — those remain as separate rows; no merge/dedupe tool is proposed here (would need its own design — instructor-initiated manual merge is out of scope).
- **Fix #5's cross-module hook change** touches `payments`/`attendance` module files; coordinate before implementation so it isn't done twice when those modules' own specs come up later in the sequence.
- Fixes #1–#4 are low blast radius, no schema change, fully reversible (revert the read/validation/prop change). Fix #5 is also reversible (revert the hooks to one-time fetch) but has a wider blast radius than the other four since it changes data-loading behavior in two other modules' hooks (`payments`, `attendance`) rather than touching only `students`-owned code.
- Fix #2b's new repository method is additive; no existing caller of `findBySchoolId` is changed, so no regression risk to other consumers of that method.
- **Student self-service rank/status view remains a gap** (Q5) — recorded as a future-spec candidate, not a permanent decision.

## 📋 Phasing
Each fix ships independently, in any order:
- **Fix #1** — Correct payment-cycle enrollment currency/amount. *Status: ✅ implemented, on `main`.*
- **Fix #2** — Validate + scope existing-member matching (service-side check + picker filter). *Status: ✅ implemented, on `main`.*
- **Fix #3** — Normalize email/phone matching. *Status: ✅ implemented, on `main`.*
- **Fix #4** — Pass `isInstructor: true` on the instructor's event-status hook call. *Status: ✅ implemented, on `main`.*
- **Fix #5** — Reactive payments/attendance detail data. *Status: ✅ implemented, on `main`.*
- **(Future, not designed here)** — Student self-service rank/join-date/status view.

## 📋 Implementation Plan

1. In `approveJoinRequest`, look up `SchoolSettingsRepository.findBySchoolId(schoolId)` before the payment-cycle enrollment loop; use `default_currency`/`default_payment_amount` (fallback `0`/`"PLN"` only if no settings row exists). Test: approving into a payment cycle for a school with `default_currency: "USD"` creates records with `currency: "USD"`.
2. Add `StudentRepository.findOfflineBySchoolId(schoolId)` (`Q.where('status', MemberStatus.OFFLINE)` + existing `deleted_at`/`school_id` filters). In `approveJoinRequest`, when `mode === "existing"`, fetch the target member first and throw `existingMemberNotEligible` if `schoolId` mismatches or `status !== OFFLINE`. Test: approving with a mismatched/non-offline `existingMemberId` throws; a valid OFFLINE member in the same school still succeeds.
3. Switch `ApproveJoinRequestSheet`'s candidate list from `StudentRepository.findBySchoolId` to `findOfflineBySchoolId`. Test: an ACTIVE or ARCHIVED member no longer appears in the "existing student" picker; an OFFLINE member does.
4. Normalize the auto-match comparison in `ApproveJoinRequestSheet`: lowercase+trim email compare; run phone numbers through the existing canonicalization helper before comparing. Test: a shadow member with `EMAIL@x.com` auto-matches a join request with `email@x.com`.
5. Add `{ isInstructor: true }` to the `useStudentEventStatuses` call in the instructor's student-detail screen. Test: tapping an event status on that screen now cycles absent → attending → paid, not just absent ↔ attending.
6. Convert `useStudentPayments`/`useStudentAttendance` from one-time fetch to `.observe()`-backed subscriptions, keeping the existing local-edit-buffer/`saveAll()` semantics unchanged (the buffer now seeds from and re-syncs against a live stream rather than a single snapshot). Test: with the student detail screen open, marking attendance for that student from another screen (e.g., an active training session) updates the open detail screen without a remount.
