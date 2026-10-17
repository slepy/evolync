# Execution plan — form validation (tags, notes, 3D names)

Date: 2026-10-18
Branch: fix/tag-validation

## Goal

Creating or renaming a tag checks its name in the service (trimmed, 1–30 characters, unique per user regardless of case). The tag sheet shows the problem under the field instead of failing silently.

## Scope

Extended on the user's request (2026-10-18) from tags to an audit of every form with text fields.

### Form audit

| Form | Before | Change |
| --- | --- | --- |
| Tag sheet | UI trim only, no service check, errors in console | Zod schema + unique name in service, error under the field |
| Note create / details | Service `.parse` threw ZodError, UI logged it | Service throws key; title error under TITLE, other failures in an `AlertBanner` |
| New 3D sequence | Raw ZodError JSON in the banner; spaces-only title passed | Key translated; titles trimmed before `min(1)`; `maxLength` on inputs |
| Save technique / starting position | Save not awaited, sheet closed on failure | Sheet awaits, keeps the error under the name |
| Events, event types, trainings, payments, payment amounts, ranks, school settings, products, students, profile, auth, join school, hand presets, rank color | Already validated with visible errors | No change |


- `src/modules/tags/validation/tagSchema.ts`: a Zod schema whose messages are translation keys (resolved when shown), plus `isTagNameTaken`.
- `src/modules/tags/services/tagService.ts`: `createTag` / `updateTag` validate before writing and throw the key of the problem.
- `src/modules/tags/repositories/tagRepository.ts`: `findByUserId` for the uniqueness check.
- `src/modules/tags/components/TagSheet.tsx`: shows the error under the name field and clears it on typing.
- New keys in `en.json` / `pl.json`; tests in `src/modules/tags/__tests__/`.

The pattern is copied from event types (`events/validation/eventTypeSchema.ts`, `events/services/eventTypeService.ts`, `EventTypeSheet`).

## Non-goals

- Tag color validation: the color is fixed by the app (`moduleAccents.tags.tint`), and the user cannot enter one.
- Existing duplicate tags in user data are left as they are; only new names and renames are checked.
- `attachTag` / `setTagsForEntity` and the PR #50 cleanup.

## Implementation Plan

### Phase 1: Validation

1. Add the tag schema, `isTagNameTaken`, `TagRepository.findByUserId` and the translation keys.
2. Validate in `createTag` / `updateTag`.
3. Show the validation error in `TagSheet`.
4. Add tests for the schema and the service.

4. Show note title validation and save errors.
5. Translate 3D validation errors and keep the save sheet open on failure.

### Phase 2: Validation gate

1. Run `npm run typecheck`, `npm run check:theme` and `npm test`.

## Risks

- A rename to the tag's own name with different case ("guard" → "Guard") must not count as taken: the tag being renamed is excluded.
- If the user ID is missing on rename, the service reads it from the stored tag, so the check never depends on the store.

## Progress

PR: #51

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Validation

- [x] 1.1 Add tag schema, name check, repository lookup and keys — ee4911e
- [x] 1.2 Validate in createTag / updateTag — ee4911e
- [x] 1.3 Show the validation error in TagSheet — ee4911e
- [x] 1.4 Add schema and service tests — ee4911e
- [x] 1.5 Show note title validation and save errors — ea5b13e
- [x] 1.6 Translate 3D validation errors and keep the save sheet open on failure — 7db79eb

### Phase 2: Validation gate

- [x] 2.1 Run typecheck, theme check and tests — 7db79eb
