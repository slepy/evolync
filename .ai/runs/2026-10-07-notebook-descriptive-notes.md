# Notebook — descriptive notes on the T1–T5 design

## Goal

Rebuild the technique notes module (Notebook tab, descriptive notes list, new note, note details, tags sheet) on the canvas section "Technique notebook — descriptive notes (list, tag filter, Person 1 / Person 2 rows, tags sheet); tags in one color (rose)", using the styleguide and `src/core/components`.

Source boards: `design/project/NotesNotebook.dc.html` (T1), `NotesList.dc.html` (T2), `NotesListFiltered.dc.html` (T2F), `NotesEmpty.dc.html` (T2E), `NoteCreate.dc.html` (T3), `NoteDetails.dc.html` (T4), `NoteDetailsEdited.dc.html` (T4A), `NoteTagsSheet.dc.html` (T5).

## Scope

- Screens: `app/techniques/index.tsx` (T1), `app/techniques/notes/{index,create,[documentId]/index}.tsx` (T2–T4A) become thin routes over module screens.
- `src/modules/techniques/notes`: list / create / details screens, `NoteForm`, `NoteRowCard`, pure logic (`noteList.ts`, `noteRows.ts`) with tests, `createNote` / `saveNote` services, `useNoteList` / `useNoteDocument` hooks.
- `src/modules/tags`: `TagPickerSheet` rebuilt as T5 on `FormSheet`; `TagSheet` reports the created tag.
- Shared (`src/core/components`): `TagChip`, `ChipFilter`, `DashedButton`; `EmptyState` gains `accent` + `action`; `PrimaryButton` `inline`, `TrashButton` `size`, `FormSheet` `badge`; accents get a `label` text color (Tags rose `#FDA4AF`).
- Tags are drawn in Tags rose regardless of their stored `color`.

## Non-goals

- No schema or Supabase changes (tables `technique_note_documents`, `technique_note_rows`, `taggables` unchanged).
- 3D and Video stay "SOON" (not wired).
- Dashboard `TechniqueNotebookSection` and the Tags list (7A–7C) are unchanged.

## Implementation Plan

### Phase 1: Shared components
- 1.1 Tokens: `neutral.soft`, Tags `label`, `label` on resolved accents (chips, Add new pill).
- 1.2 `TagChip`, `ChipFilter`, `DashedButton`.
- 1.3 `EmptyState` accent + action, `PrimaryButton` inline, `TrashButton` size, `FormSheet` badge.

### Phase 2: Notes data and logic
- 2.1 `noteList.ts` (filter, tag join, date) and `noteRows.ts` (direction, row diff, change detection) with tests.
- 2.2 Repository observers, `createNote` / `saveNote` services, `useNoteList` / `useNoteDocument` hooks.

### Phase 3: Screens
- 3.1 Tags sheet T5 (`TagPickerSheet`), `TagSheet.onCreated`; remove `TagFilterBar`, `EntityTagsSection`.
- 3.2 Notes list T2 / T2F / T2E.
- 3.3 New note T3, note T4 / T4A (`NoteForm`, `NoteRowCard`).
- 3.4 Notebook tab T1 on `TabPage`, thin routes.
- 3.5 Translations (en + pl) and CLAUDE.md component catalog.

## Risks

- Save on T4 is shown only when the content differs from the database; after Save the form adopts the stored rows once the database reflects the save (so new rows get real ids). Covered by pure tests of `isNoteChanged` / `normalizeDraft`; screen behaviour needs manual QA.
- No logged-in test account was available, so screens were not walked in a browser; the web bundle export succeeds.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Shared components

- [ ] 1.1 Tokens and accent label
- [ ] 1.2 TagChip, ChipFilter, DashedButton
- [ ] 1.3 EmptyState, PrimaryButton, TrashButton, FormSheet props

### Phase 2: Notes data and logic

- [ ] 2.1 Pure note logic with tests
- [ ] 2.2 Repositories, services and hooks

### Phase 3: Screens

- [ ] 3.1 Tags sheet T5
- [ ] 3.2 Notes list T2 / T2F / T2E
- [ ] 3.3 New note T3 and note T4 / T4A
- [ ] 3.4 Notebook tab T1 and routes
- [ ] 3.5 Translations and CLAUDE.md
