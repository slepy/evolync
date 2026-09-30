# Attendance Module — Specification (as-built + remediation)

> **Status (2026-09-30):** All five fixes plus the two folded-in mechanical items below are implemented and live on `main` (commit `2c81b92`, landed the same day this spec was authored — the remediation shipped directly alongside the as-built documentation rather than through a separate PR). Verified by direct code inspection: batched `database.batch()` writes in `attendanceService.ts`, atomic `database.write()` guards in `upsertAttendanceRecord`/`getOrCreateSessionForDate`, `attendanceStatusSchema`/`createTrainingSessionSchema` wired into every write path, `disabled` treatment for archived members in `useAttendance`/`AttendanceListItem`, `Q.where('deleted_at', null)` in `TrainingSessionRepository.findByIds`, UTC-day boundaries in `getOrCreateSessionForDate` and `observeTodayBySchoolId`, and the complete barrel exports in `attendance/index.ts`.
>
> The one item intentionally left out of this spec's client-code scope — aligning the Supabase `attendance_records.status` column default from `'absent'` to `'present'` (a schema migration, see Data Model) — is tracked separately as [issue #4](https://github.com/slepy/evolync/issues/4).

## 📝 TLDR
Documents current behavior of `src/modules/attendance/` — training sessions (one per school per day) with a roster of `attendance_records` (present/absent/excused) per session, marked by the instructor for the whole class at once. Five independently shippable fixes are proposed for the data-integrity and consistency gaps found: non-transactional bulk saves, no client-side duplicate guard, unused validation, archived/soft-deleted data leakage, and timezone-sensitive day-boundary logic.

## 📝 Problem Statement
- `bulkUpdateAttendanceStatus`, `bulkUpsertAttendance`, and `bulkSaveAttendanceList` all loop sequential single-record writes with no `database.batch()` and no partial-failure handling — a mid-loop error leaves the local DB partially updated with no rollback and no report of which edits landed.
- The DB enforces `unique(training_session_id, school_member_id)` and `unique(school_id, date)`, but nothing mirrors this locally — `upsertAttendanceRecord`'s find-then-create and `getOrCreateSessionForDate`'s check-then-create are both race-prone, surfacing only as an unhandled sync-push conflict.
- `createTrainingSessionSchema`/`attendanceStatusSchema` (Zod) are defined and exported but never called in any write path — dates and statuses reach the DB unvalidated at runtime.
- Archived students' historical attendance records remain editable (not just visible) in past-session roster views, and soft-deleted training sessions can still surface in a student's own history (`TrainingSessionRepository.findByIds` has no `deleted_at` filter).
- "One session per school per day" is computed from device-local midnight boundaries while the DB stores a plain `date` column — cross-device/cross-timezone disagreement about which calendar day a session belongs to is possible.

## 📝 Proposed Solution
Five independently shippable fixes:

1. **Batch bulk writes + partial-failure reporting** — rewrite `bulkUpdateAttendanceStatus`, `bulkUpsertAttendance`, `bulkSaveAttendanceList` to build one `database.batch()` of `prepareUpdate`/`prepareCreate` operations (mirroring `createSessionWithAttendance`'s existing pattern) instead of a sequential await-loop. A batch either fully commits or fully fails — no partial-state gap — and the caller's `saveAll()` (in `useAttendance`/`useStudentAttendance`) surfaces a single success/failure instead of an ambiguous partial state.
2. **Client-side duplicate guard** — `upsertAttendanceRecord` and `getOrCreateSessionForDate` wrap their find-then-create in a `database.write()` transaction so the check and the create happen atomically from WatermelonDB's perspective (eliminates the in-app race; the remaining cross-device race is still resolved by the existing DB unique constraint at sync time, which is out of scope to change).
3. **Wire existing validation schemas into the write path** — `createTrainingSession`/`getOrCreateSessionForDate` run the DTO through `createTrainingSessionSchema` before writing; `upsertAttendanceRecord`/bulk functions validate each status through `attendanceStatusSchema`. Throws a clear validation error instead of trusting the caller — a safety net for any future caller that isn't the current fixed-control UI (e.g. a future bulk-import feature).
4. **Fix archived/soft-deleted data leakage** — two parts: (a) session-roster hydration (`useAttendance`, via `StudentRepository.findByIds`) marks a member's row read-only when their current `status` is `ARCHIVED`, instead of leaving it silently editable — the historical record still displays (attendance history is preserved), it just can't be changed; (b) `TrainingSessionRepository.findByIds` adds the standard `Q.where('deleted_at', null)` filter, so a soft-deleted session's records no longer surface in a student's own attendance history.
5. **Normalize session-day computation to a single timezone convention** — `getOrCreateSessionForDate` and `observeTodayBySchoolId` switch from device-local midnight boundaries to UTC-day boundaries (no school-timezone field exists yet to normalize against instead — UTC is the practical fix available today; revisit if/when schools gain a stored timezone). All devices computing "today" or "the session for date X" now agree regardless of local timezone offset.

## 📝 Architecture
No new modules or cross-module dependencies. All five fixes are internal to `attendance`'s own service/repository layer.

## 📝 Data Model
No schema changes for Fixes #1–#5. Fix #2's atomicity is a transaction-boundary change, not a schema change. Fix #5 changes only which boundary values (`Date` objects) are computed in JS before querying — the stored `date`/timestamp columns are unchanged. The one exception is the folded-in DB default alignment (`attendance_records.status` default `'absent'` → `'present'`): this **is** a schema change — a Supabase migration, not a client-code edit — and is out of this spec's client-code scope to implement directly; it's recorded here as a follow-up migration to request, not something the implementation plan's client-side work can complete on its own.

## 📝 API Contracts
No public contract changes. Fix #1 changes the internal return behavior of the three bulk functions from `Promise<void>` (which could reject mid-way with partial commits) to `Promise<void>` that either fully succeeds or fully rejects with nothing committed — a stricter but compatible contract for existing callers. Fix #3 adds a new thrown error case (validation failure) to `createTrainingSession`/`getOrCreateSessionForDate`/`upsertAttendanceRecord` and the bulk functions.

## 📝 UI/UX
- Fix #1, #2, #3, #5: no visible UI change — correctness fixes underneath existing screens.
- Fix #4: an archived student's row in a past session's roster view renders with the same "read-only" visual treatment already used elsewhere (e.g. `StudentAttendanceHistoryItem`'s `disabled` state) instead of being tappable.

## 📝 Edge Cases & Failure Scenarios
| Scenario | Current behavior | Behavior after this spec |
|---|---|---|
| Bulk save fails partway through | Some records updated, some not, buffer not cleared, no indication which | Batch fully commits or fully fails, single clear outcome (fix #1) |
| Two rapid taps create a record for the same member+session | Possible local duplicate, only caught at sync (fix #2) | Prevented locally via atomic check-then-create |
| Instructor creates a session with an invalid/unparseable date somehow reaching the service | Silently accepted | Throws a validation error (fix #3) |
| Editing a past session that includes a since-archived member | Editable, indistinguishable from active members | Read-only, historical value preserved (fix #4a) |
| Student views their own history after a session was soft-deleted | Soft-deleted session's records still show | No longer surfaces (fix #4b) |
| Instructor's device is in a different timezone than expected, checks "today's session" near midnight | May disagree with another device/the server about which day it is | Both agree via UTC-day boundary (fix #5) |

## 📝 Risks & Impact Review
- Fix #5's switch to UTC-day boundaries can shift which calendar day a session near local midnight is attributed to, relative to today's device-local behavior, for schools operating far from UTC — a one-time behavior change worth a release note, not a regression in the offline-first guarantee.
- Fix #1 is the only one touching write transaction shape for existing callers (`useAttendance.saveAll`, `useStudentAttendance.saveAll`) — regression-test both save paths, not just one, since they share the changed functions.
- Fixes #2–#4 are low blast radius, no schema change, fully reversible.
- Two smaller, mechanical inconsistencies noticed during research and folded into this pass at no extra design cost: the module barrel (`src/modules/attendance/index.ts`) is missing several hook/service exports that consumers currently reach around by importing from subpaths directly — add the missing exports for consistency; and the client's `DEFAULT_ATTENDANCE_STATUS` (`"present"`) vs. the Supabase column default (`'absent'`) — align the Supabase default to `'present'` to match actual client behavior, since the client is the only writer of new records today.

## 📋 Phasing
Each fix ships independently, in any order:
- **Fix #1** — Batch bulk writes + partial-failure reporting. *Status: ✅ implemented, on `main`.*
- **Fix #2** — Client-side duplicate guard (atomic check-then-create). *Status: ✅ implemented, on `main`.*
- **Fix #3** — Wire existing Zod validation into the write path. *Status: ✅ implemented, on `main`.*
- **Fix #4** — Fix archived/soft-deleted data leakage (read-only archived rows + session `deleted_at` filter). *Status: ✅ implemented, on `main`.*
- **Fix #5** — Normalize session-day computation to UTC. *Status: ✅ implemented, on `main`.*
- (Folded in, no separate phase): barrel export fix — *Status: ✅ implemented, on `main`.* DB default alignment — *Status: not yet implemented; tracked as [issue #4](https://github.com/slepy/evolync/issues/4) (schema migration, out of this spec's client-code scope).*

## 📋 Implementation Plan

1. Rewrite `bulkUpdateAttendanceStatus`, `bulkUpsertAttendance`, `bulkSaveAttendanceList` to build a `database.batch()` of `prepareUpdate`/`prepareCreate` calls inside one `database.write()`, mirroring `createSessionWithAttendance`. Test: inject a failure on the 3rd of 5 updates — assert zero records changed (not 2 of 5).
2. Wrap `upsertAttendanceRecord`'s find-then-create and `getOrCreateSessionForDate`'s check-then-create in a single `database.write()` covering both the read and the conditional write. Test: fire two concurrent `upsertAttendanceRecord` calls for the same session+member — assert exactly one record exists afterward.
3. Call `createTrainingSessionSchema.parse(...)` inside `createTrainingSession`/`getOrCreateSessionForDate`, and `attendanceStatusSchema.parse(...)` inside `upsertAttendanceRecord` and each bulk function's per-item status, before writing. Test: passing an invalid status string throws before any DB write occurs.
4. In `useAttendance`'s roster hydration, cross-reference each member's current `status` (already available via `StudentRepository.findByIds`) and mark the row `disabled` in the UI when `status === ARCHIVED`; add `Q.where('deleted_at', null)` to `TrainingSessionRepository.findByIds`. Test: a session containing a now-archived member renders that row non-interactive; a student's history no longer includes a soft-deleted session.
5. Replace device-local `setHours(0,0,0,0)`/`(23,59,59,999)` boundary computation in `getOrCreateSessionForDate` and `TrainingSessionRepository.observeTodayBySchoolId` with UTC-day boundaries. Test: with the device clock set to a timezone that crosses midnight relative to UTC, "today's session" resolves to the same session as a UTC-based reference calculation.
6. Add the missing hook/service exports to `src/modules/attendance/index.ts` (pure client-code change, testable now). Separately, request a Supabase migration changing `attendance_records.status`'s column default from `'absent'` to `'present'` (a DB schema change, not part of this spec's client-side implementation — file as a follow-up migration task). Test: existing imports from the module barrel still resolve.
