# Archived students list (16A header action, 16H, 16G1)

## Goal

An instructor opens the archived students of a school from the top-right corner of the Students list (16A) and can bring a student back with Restore.

## Brief (user, Polish, paraphrased)

On the students list, put an action in the top-right corner (like other screens) that opens the archived students. A ⋮ menu is optional; propose a sensible direct icon. Update the design boards (design-mockups), pull the updated designs into the repo, update the documentation.

## Decisions

- **Direct icon, no ⋮ menu.** The header gets one 44px `IconButton` with the Lucide `Archive` icon (label "Archived students") next to the Synced pill, the same `right` slot that 16E / 14B use for ⋮. With only one action, a menu would add a tap for nothing. If more list actions come later, the icon can move into a ⋮ sheet.
- **16H Archived students**: a sub-screen with the same header, a search field, the archived rows (dimmed avatar with the rank corner, "Archived" badge), and an empty state. Tapping a row opens the student details (16E).
- **16G1 Restore**: for an archived student, the ⋮ sheet on the details screen shows Restore (students accent) in place of Archive. An archived list with no way back would be a dead end. Restore sets the status back to `active` (has an app account) or `offline` (no account). This is the only status pair archive can come from: pending/rejected members are join requests, not students.

## Scope

- Design boards: `design/project/StudentsList.dc.html` (header button), new `StudentsArchived.dc.html` (16H) and `StudentActionsSheetArchived.dc.html` (16G1), `canvas.json`. Published to the claude.ai canvas "Evolync Redesign Mockups" and pulled back into the repo.
- students module: repository `observeArchivedBySchoolId`, pure `restoredStatus` + `archivedStudents` helpers (tests), `restoreStudent` service, `useArchivedStudents` hook, `ArchivedStudentsScreen`, Restore row in `StudentActionsSheet`, header button in `StudentsScreen`.
- Route `app/school/[schoolId]/students/archived.tsx`.
- Translations en / pl / hu.
- Docs: CLAUDE.md "Built so far" entry, design-mockups skill note.

## Non-goals

- No schema / Supabase change (status `archived` already exists and syncs).
- No bulk restore, no permanent delete of archived students.
- No change to other lists that already hide archived members.

## Implementation Plan

### Phase 1: Designs

1. Update 16A and add 16H / 16G1 boards in `design/project/` + `canvas.json`.
2. Publish the changed boards to the claude.ai canvas.
3. Pull the published boards back into the repo and confirm they match.

### Phase 2: Data

1. Repository query, `restoredStatus` / `archivedStudents` helpers, `restoreStudent` service, with unit tests.

### Phase 3: UI

1. Header Archive button on 16A + `archived` route.
2. `ArchivedStudentsScreen` (16H) with `useArchivedStudents`.
3. Restore in the details ⋮ sheet (16G1).
4. Translations en / pl / hu.

### Phase 4: Docs

1. Update CLAUDE.md and the design-mockups skill.

## Risks

- The canvas is shared: publishing only the three changed boards + `canvas.json` keeps other boards untouched.
- Restore on a student whose account was removed later: the status follows `userId`, so it falls back to `offline`.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Designs

- [x] 1.1 Update 16A and add 16H / 16G1 boards — de8fee6
- [x] 1.2 Publish the changed boards to the canvas — canvas version 314
- [x] 1.3 Pull the published boards back into the repo — de8fee6 (pulled copies byte-identical)

### Phase 2: Data

- [x] 2.1 Archived query, restore helpers and service with tests — 20143a5

### Phase 3: UI

- [x] 3.1 Header Archive button on 16A and archived route — 3e85e7f
- [x] 3.2 ArchivedStudentsScreen (16H) — 00ba535
- [x] 3.3 Restore in the details actions sheet (16G1) — 5174737
- [x] 3.4 Translations en / pl / hu — 3655e5e

### Phase 4: Docs

- [x] 4.1 Update CLAUDE.md and the design-mockups skill — 914802f

### Phase 5: Review fixes

- [x] 5.1 Archived status wins over No account on the details screen — 634fe81
