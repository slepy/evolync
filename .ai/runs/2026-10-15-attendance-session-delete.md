# Execution plan — delete an attendance session from its details screen

Source doc: .ai/specs/2026-09-26-attendance-module.md

## Goal

An instructor can delete a training session (attendance) from its details screen
(organization → school → Attendance → session details, route
`/school/[schoolId]/attendance/[sessionId]`).

## Scope

- `attendanceService.deleteTrainingSession` — make the soft delete of the session and its
  attendance records one atomic `database.write()` batch (today it is two separate writes,
  so a failure in between leaves orphaned-deleted records under a live session).
- `AttendanceSessionScreen` (13B) — `TrashButton` in the `SubScreenPage` header (`right`),
  `confirmDelete` alert, back to the sessions list after deleting; error shown above the button.
- Translations `attendanceDeleteTitle` / `attendanceDeleteMessage` in `en.json` and `pl.json`.
- Spec `.ai/specs/2026-09-26-attendance-module.md` — document the delete flow.

## Non-goals

- No schema / Supabase migration: soft delete via `deleted_at` already syncs like every other table.
- No delete from the sessions list (swipe / long press) — details screen only.
- No undo.

## Implementation Plan

### Phase 1: Service
- 1.1 Atomic `deleteTrainingSession` (one write, one batch, skips already-deleted records) + unit test on the in-memory database.

### Phase 2: UI
- 2.1 Trash button with confirmation on the session details screen + translations.

### Phase 3: Spec
- 3.1 Update the attendance spec with the delete flow.

## Risks

- Deleting a session hides its records from students' attendance history and from stats
  (both already filter `deleted_at`). Intended; the confirmation states it cannot be undone.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Service

- [ ] 1.1 Atomic deleteTrainingSession with unit test

### Phase 2: UI

- [ ] 2.1 Trash button with confirmation on session details

### Phase 3: Spec

- [ ] 3.1 Update the attendance spec
