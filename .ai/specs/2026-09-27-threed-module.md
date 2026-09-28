# 3D Editor Module (`threed`) — Specification (as-built + remediation)

## 📝 TLDR
Documents current behavior of `src/modules/threed/` — a per-user-private pose/technique/sequence editor (Technique → StepTechnique → SequenceStep → Sequence hierarchy, V1/V2/V3 data-format evolution, FK bone system, hand presets — full architecture already covered by the repo's own `threed-guide` skill, not re-derived here). **The entire module is currently, deliberately unreachable from the app's UI** — confirmed intentional, staged rollout (the "3D" and "Video" mode cards on `/techniques` are both `disabled` with a "Coming Soon" watermark; only the plain-text Notes mode is live). No schema-registration bug was found. Several cleanups have already landed: an orphaned duplicate route tree deleted, a fully-unused `step_techniques` join table and its infrastructure removed, dead service/repository exports removed, and Zod validation added to the two write paths that previously had none anywhere in the module. Two feature/scope decisions are recorded as confirmed and carried forward as follow-ups, not designed here.

## 📝 Problem Statement (as found)
- Two nearly-identical route trees existed: `app/threed/*` (fully orphaned — nothing in the app linked to it) and `app/techniques/threed/*` (the real one, but gated behind a disabled card).
- `step_techniques` — a full table with schema, WatermelonDB model, migration, repository, and Postgres RLS on both client and server — was never once written to by any app code; technique references are stored inline as JSON inside `sequence_steps.data` instead.
- `deleteTechnique` (service) and `BodyPosePresetRepository.findAll`/`.observeAll` (repository) had zero call sites — dead code, the latter would have bypassed per-user scoping if ever wired up.
- `training_plans`/`plan_sequences` exist only in Postgres (with their own RLS) — designed to let an instructor bundle sequences into a shareable plan, but never given any client-side model/repository/service/screen. Confirmed to be removed as a planned feature, not carried forward.
- Zero Zod validation existed anywhere in the module — worse than every other audited module, which at least had *unused* Zod schemas sitting next to the write path; `threed` had none at all.

## 📝 Proposed Solution — implemented
1. **Deleted the orphaned `app/threed/*` route tree** (8 files) — confirmed zero references anywhere in the app before removal. `app/techniques/threed/*` remains the one real (currently gated) implementation.
2. **Removed `step_techniques` entirely**: the table definition from `src/modules/threed/database/schema.ts`, the `StepTechnique` WatermelonDB model, its repository, its `@children` relation on `SequenceStep`, and all barrel exports. The historical migration step (`toVersion: 9` in `src/database/migrations.ts`) that originally created this table locally was left untouched — removing a completed migration step would not affect already-migrated devices and risks nothing being gained by touching history; any device that already ran it simply keeps an unused, harmless local table. **Follow-up needed, not executed here**: a Postgres migration to drop `step_techniques` server-side (a live schema change against production requires its own reviewed migration file, out of scope for this documentation-and-client-code pass).
3. **Removed dead code**: `deleteTechnique` (service, zero callers), `BodyPosePresetRepository.findAll`/`.observeAll` (zero callers).
4. **Added Zod validation** (`src/modules/threed/validation/threedSchema.ts`, new) covering the module's actual write paths: `createSequenceSchema`/`updateSequenceSchema` (title, description length), `createTechniqueSchema`/`updateTechniqueSchema` (title/description length, `bodyPart` checked against the union of valid IK body parts and FK body groups), `addStepSchema` (sequence id, order index, duration, a loose but real shape check that pose/step data is a non-null object rather than trusting the caller blindly). Wired into `createSequence`, `updateSequence`, `saveTechnique`, `updateTechnique`, and `addStepToSequence`. The six new validation error keys were added to both `en.json` and `pl.json` — they didn't exist before.

**Confirmed as intentional, carried forward, not designed here:**
- **The module stays dark on purpose.** Both the 3D and Video technique-notebook modes are deliberately gated behind "Coming Soon" cards as part of a staged rollout — this is not a regression to fix.
- **`training_plans`/`plan_sequences` are being removed as a feature**, not built. Follow-up needed, not executed here: a Postgres migration dropping these two tables, and a correction to `.ai/db-plan.md`/`.ai/api-plan.md` (which still describe them, and describe 3D assets as "potentially shared," as live/planned) to reflect that no sharing mechanism exists or is planned.
- **No sequence-step reordering feature** (steps can only ever be appended) — confirmed as intentional design, not a gap.

## 📝 Architecture
No new modules. Removing `step_techniques` simplifies `SequenceStep`'s associations (now only `belongs_to sequences`, no `has_many step_techniques`). No other module depends on anything removed here — confirmed via repo-wide grep before each removal.

## 📝 Data Model
- Removed: `step_techniques` table (client-side; Postgres-side removal is a follow-up, not executed here).
- No other schema changes. The pre-existing `is_system` column drift on `body_pose_presets` (present in an old local migration step, absent from the current schema.ts and from Postgres) is noted here as a low-risk, harmless historical inconsistency — not fixed in this pass, since WatermelonDB has no `removeColumns` primitive and the column is read nowhere.

## 📝 API Contracts
- Removed: `deleteTechnique`, `BodyPosePresetRepository.findAll`, `BodyPosePresetRepository.observeAll`, `StepTechniqueRepository` (entire file) — all confirmed zero call sites before removal.
- `createSequence`/`updateSequence`/`saveTechnique`/`updateTechnique`/`addStepToSequence` now throw a Zod validation error (new error case) before writing, in addition to existing behavior.

## 📝 UI/UX
No visible UI change — the module remains gated behind the "Coming Soon" cards regardless of these fixes. When it is eventually enabled, users will additionally get inline validation errors for invalid titles/body parts/malformed pose data that previously would have been silently written.

## 📝 Edge Cases & Failure Scenarios
| Scenario | Before | After |
|---|---|---|
| Save a technique with an empty title | Silently accepted | Throws `threedValidationTitleRequired` before writing |
| Save a technique with an unrecognized `bodyPart` string | Silently accepted | Throws `threedValidationInvalidBodyPart` |
| Add a step with malformed (non-object) pose data | Silently accepted, serialized as-is | Throws `threedValidationInvalidData` |
| Delete a sequence with steps | Two separate, non-atomic writes (soft-delete steps, then the sequence) — unchanged by this pass | Same — **not fixed in this pass**, recorded as a known risk below |
| A user navigates to `/threed/...` (old orphaned route) | 404 today already (nothing linked there), now the files themselves are gone too | Same outcome, cleaner codebase |

## 📝 Risks & Impact Review
- All four implemented fixes are low blast radius: two deletions of confirmed-dead code/routes, one table removal with a verified-zero-consumer check beforehand, one additive validation layer that only rejects input that was already meant to be invalid.
- **`deleteSequence`'s non-atomicity is a pre-existing, unresolved risk** (soft-deletes all steps, then the sequence, as two separate transactions) — the same class of issue already fixed in `attendance`/`payments`/`orders`/`events`. Not addressed in this pass since it wasn't in scope of the decisions made for this module; flagged here for a future pass given the module will eventually ship.
- **The Postgres-side `step_techniques`/`training_plans`/`plan_sequences` drops are follow-up work**, not executed here — a live database schema change needs its own reviewed migration, which is outside what a documentation-and-client-code pass should commit to unilaterally.
- Stale `.ai/db-plan.md`/`.ai/api-plan.md` sharing language should be corrected once `training_plans`/`plan_sequences` are actually dropped, to avoid a future reader assuming a sharing feature is still planned.

## 📋 Phasing
All four fixes for this pass have already landed. Two items are explicit follow-ups, not phased here:
- **(Follow-up, not executed)** — Postgres migration dropping `step_techniques`, `training_plans`, `plan_sequences`.
- **(Follow-up, not executed)** — Correcting `.ai/db-plan.md`/`.ai/api-plan.md` to drop the sharing/training-plan language.

## 📋 Implementation Plan (already executed)
1. Deleted `app/threed/*` (confirmed zero references beforehand).
2. Removed `step_techniques` from `src/modules/threed/database/schema.ts`; deleted `src/database/models/StepTechnique.ts` and `src/modules/threed/repositories/stepTechniqueRepository.ts`; removed the `@children("step_techniques")` relation and its import from `SequenceStep.ts`; removed all barrel/model-registry references (`src/database/index.ts`, `src/database/models/index.ts`, `src/modules/threed/repositories/index.ts`, `src/modules/threed/index.ts`).
3. Removed `deleteTechnique` from `techniqueService.ts` and its exports; removed `findAll`/`observeAll` from `BodyPosePresetRepository`.
4. Added `src/modules/threed/validation/threedSchema.ts` (5 schemas) and wired them into `createSequence`, `updateSequence`, `saveTechnique`, `updateTechnique`, `addStepToSequence`; added 6 new i18n keys to `en.json`/`pl.json`.

Verification: `npm run typecheck` shows no new errors in `SequenceStep.ts`, the removed/edited files, `threedSchema.ts`, or `bodyPosePresetRepository.ts` — every remaining error is pre-existing and unrelated (the one `techniqueService.ts` type error present both before and after this pass is a pre-existing `BodyPart | string` looseness in `CreateTechniqueDto`, unrelated to the validation added here).
