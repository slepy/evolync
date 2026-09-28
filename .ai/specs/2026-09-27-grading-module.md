# Grading Module — Specification (as-built + remediation)

## 📝 TLDR
Documents current behavior of `src/modules/grading/` — one flat, ordered rank/belt list **per organization** (not per school; all schools under one org share the same ranks — confirmed intentional for now), shown as a cosmetic name+color badge on a student's profile with no functional gating of any other module's content (no relation to `threed`). No schema/migration bug was found (clean, unlike `payments`/`orders`/`inventory`). All six fixes decided for this module have already been implemented during this pass — see below.

## 📝 Problem Statement (as found)
- Dead, never-wired-up "reorder ranks" plumbing existed: `reorderRanks`, `saveGradingConfig` (service functions) and `RankEditorRow` (a drag-handle list-row component) had zero call sites — the shipped UI only supports one-rank-at-a-time create/edit/delete, with no reordering.
- `createRankSchema`/`updateRankSchema` (Zod) existed but were never invoked — the running app validated only `!name.trim()` ad hoc, so the documented 50-character limit and hex-color format were not actually enforced.
- Deleting a rank left `school_members.current_rank_id` pointing at a soft-deleted, now-invisible rank for any student who held it — a dangling foreign key with no cleanup.
- No duplicate-rank-name guard existed at any layer.
- `assignRankToStudent` lived in the `grading` module's service file but operated entirely on `students`-owned data (`SchoolMember.currentRankId`) via `StudentRepository` — an unusual cross-module ownership split.
- The create-rank screen had no color field (only name), requiring a second edit step to set a color, unlike the edit screen which exposes both.

## 📝 Proposed Solution — all six fixes already implemented
1. **Removed dead reorder plumbing**: `reorderRanks`, `saveGradingConfig` deleted from `gradingService.ts`; `RankEditorRow.tsx` deleted and its barrel export removed. If drag-to-reorder is wanted later, it gets designed and wired up fresh.
2. **Wired the existing Zod schemas in**: `create.tsx` now calls `createRankSchema.safeParse` and `GradingRankEditScreen.tsx` calls `updateRankSchema.safeParse` before submitting, surfacing translated validation errors inline instead of the previous ad hoc `!name.trim()` check. The corresponding i18n keys (`gradingValidationNameRequired`, `gradingValidationNameTooLong`, `gradingValidationColorInvalid`, `gradingErrorDuplicateName`) were added to both `en.json` and `pl.json` — they didn't exist before despite being referenced by the schema's error messages.
3. **`deleteRank` now clears the dangling FK**: it looks up every `SchoolMember` with `currentRankId` equal to the rank being deleted (`StudentRepository.findByCurrentRankId`, a new repository method) and clears their `currentRankId` in the same atomic `database.batch()` that soft-deletes the rank and renumbers the remaining ones.
4. **Duplicate-name guard added**: `addRank`/`updateRank` now case-insensitively check the organization's existing ranks and throw `gradingErrorDuplicateName` on a match (excluding the rank being edited, for updates).
5. **`assignRankToStudent` moved to the `students` module** (`studentService.ts`, re-exported from `students`' service barrel) — it only ever touched `SchoolMember`/`StudentRepository`, so it now lives where its data lives. The one call site (`app/school/[schoolId]/students/[studentId]/index.tsx`) was updated to import it from `@/modules/students/services` instead of `@/modules/grading/services/gradingService`.
6. **Create screen now has a color field**, matching the edit screen — `ColorPickerSheet` is reused, and the created rank's color is submitted along with its name.

As a byproduct of touching `organization/validation/index.ts` while verifying no regressions, an unrelated pre-existing broken import was also fixed: that file re-exported a nonexistent `./gradingSchema` module (a real TypeScript compile error, not a design gap) — it's now an empty barrel, since the `organization` module has no validation schema of its own (confirmed in the `organization`/`school` spec's research).

**Confirmed as intentional, not changed by this spec**: one rank/belt system per organization (not per school) — all schools under one org share ranks. Accepted as current, deliberate scope "for now."

## 📝 Architecture
- `assignRankToStudent`'s move (fix #5) removes `grading`'s only write into `students`-owned data — `grading` now only touches its own `organization_gradings` table plus a read-only cross-module query (`StudentRepository.findByCurrentRankId`, used by `deleteRank`'s cleanup). This mirrors the existing, already-established pattern of modules reading each other's repositories directly (e.g. `orders` reading `inventory`'s repositories).
- No new modules.

## 📝 Data Model
No schema changes. Fix #3 uses a new repository query (`StudentRepository.findByCurrentRankId`) against the existing `school_members.current_rank_id` column — no migration needed.

## 📝 API Contracts
- Removed: `reorderRanks`, `saveGradingConfig` (confirmed zero call sites before removal).
- Moved: `assignRankToStudent` — now exported from `@/modules/students/services` instead of `@/modules/grading/services/gradingService`. The one call site was updated; no other callers existed.
- `updateRank` gained a required `organizationId` first parameter (needed for the duplicate-name check) — its one call site (`GradingRankEditScreen.tsx`) was updated.
- `addRank`/`updateRank`/`deleteRank` now throw new error cases (`gradingErrorDuplicateName` on name collision) in addition to existing behavior.
- New repository method: `StudentRepository.findByCurrentRankId(rankId)`.

## 📝 UI/UX
- Create and edit rank screens now show inline validation errors (name length, color format, duplicate name) instead of silently doing nothing on invalid input.
- Create screen gained a color picker, matching the edit screen.
- No other visible UI change — the FK-cleanup and reorder-code-removal fixes are invisible to the instructor.

## 📝 Edge Cases & Failure Scenarios
| Scenario | Before | After |
|---|---|---|
| Instructor deletes a rank held by 3 students | Rank disappears from their profile UI, but `current_rank_id` FK stays dangling in the DB | FK cleared for all 3 in the same atomic batch as the delete |
| Instructor creates a rank with a name that already exists | Silently created, two identical-looking rows | Throws `gradingErrorDuplicateName`, shown inline |
| Instructor types a 60-character rank name | Silently accepted (limit existed only in unused Zod schema) | Rejected with `gradingValidationNameTooLong` before saving |
| Instructor creates a rank without picking a color | Created colorless, required a second edit to add one | Color can be set at creation time |

## 📝 Risks & Impact Review
- All changes are low blast radius: two deletions of confirmed-dead code, one repository addition (additive, no existing query changed), one cross-module file move with a single updated call site, and inline validation that only rejects input the schema already declared invalid.
- Fix #5's signature change to `updateRank` (added `organizationId` parameter) is a breaking internal API change, but its only call site was updated in the same pass — no dangling caller.
- The unrelated `organization/validation/index.ts` broken-import fix is a pure compile-error correction with zero behavior change (nothing imported from that barrel).

## 📋 Phasing
All fixes have already landed in this pass; no further phasing is needed for this module.

## 📋 Implementation Plan (already executed)
1. Deleted `reorderRanks`, `saveGradingConfig` from `gradingService.ts`; deleted `RankEditorRow.tsx` and its barrel export.
2. Added `StudentRepository.findByCurrentRankId`; updated `deleteRank` to clear affected members' `currentRankId` in the same batch as the rank soft-delete.
3. Added a case-insensitive duplicate-name check to `addRank`/`updateRank`, throwing `gradingErrorDuplicateName`.
4. Moved `assignRankToStudent` into `studentService.ts` (re-exported from `students`' service barrel); updated its one call site's import.
5. Wired `createRankSchema`/`updateRankSchema` into `create.tsx`/`GradingRankEditScreen.tsx`; added the four missing i18n keys to `en.json` and `pl.json`.
6. Added a color picker to `create.tsx`, matching the edit screen.
7. Fixed the unrelated broken `./gradingSchema` re-export in `organization/validation/index.ts` (compile-error correction, no behavior change).

Verification: `npm run typecheck` shows no errors in any touched file (`grading/*`, `students/repositories/studentRepository.ts`, `students/services/studentService.ts`, `organization/validation/index.ts`) — remaining typecheck output is pre-existing, unrelated errors in other modules.
