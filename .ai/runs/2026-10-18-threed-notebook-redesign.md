# Execution plan — 3D notebook redesign (D2–D9)

Date: 2026-10-18
Branch: feat/threed-notebook-redesign
Source doc: `design/project/ThreeD*.dc.html` (board "3D notebook — sequences, techniques, starting positions; editor, hand editor, viewer", accent 3D lime, opened from the Notebook tab)

## Goal

Rebuild the 3D notebook screens on the shared core components so they match the boards, then remove the files and translation keys the rebuild leaves unused.

## Scope

- Library `/techniques/threed`: `SubScreenPage` "3D", `IconTabs` Sequences / Techniques / Positions, search, "Your sequences" with Add new, sequence rows (steps · date, tag chips), technique rows (body part · date) with the body-part chip filter, starting positions, empty states (ThreeDLibrary, ThreeDTechniques, ThreeDPositions, ThreeDEmpty).
- New sequence (ThreeDSequenceCreate): TITLE, DESCRIPTION, TAGS, pinned Create; the editor opens on step 1. Sequences get tags through the polymorphic `taggables` table (`taggable_type = "threed_sequence"`, no schema change: the type check was dropped in `20260428000000`).
- Sequence details (ThreeDSequence): title, description, tags, step preview card with Edit / View, numbered steps with delete, delete sequence.
- Technique / position preview (ThreeDTechniquePreview): 3D preview, title, body part, "Saved … · used in N sequences", delete.
- Viewer (ThreeDViewer): full-screen model, top bar, previous / next with "STEP 2 OF 6" and the step caption.
- Editor (ThreeDEditor, ThreeDEditorJoint, ThreeDEditorPartner): top bar (back, sequence title, "Step N of M", Sync), camera pad, steps strip with Add step, hint, action bar Partner / Positions / Save position / Reset + Save; joint panel (Rotate / Move, X Y Z values, Mirror, Save technique, Techniques, Save).
- Sheets over the editor: Save technique (ThreeDSaveTechnique), Techniques (ThreeDTechniqueSheet), Positions.
- Hand editor (ThreeDHandEditor): finger radio, segment 1–3, axis values, presets with Add new.
- Afterwards: delete files nothing imports any more, remove unused translation keys, check that every used key exists in en and pl.

## Non-goals

- 3D engine internals (`ThreeDCanvas`, `HumanModel`, FK system, bone markers, data formats V1–V3) stay as they are; only the screens and panels around them change.
- No database schema or Supabase migration changes.
- Step captions ("Overhook grip, right arm") are not stored today; the boards' caption falls back to "Step N" (a stored caption needs a column and a migration).
- Video in the Notebook stays SOON.

## Implementation Plan

### Phase 1: Library

1. Sequence tags and list data: `threed_sequence` taggable type, list hooks resolving tags and step counts, pure filter/format helpers with tests.
2. Library screen with the three tabs, search, body-part filter, rows and empty states; route `/techniques/threed`.

### Phase 2: Sequence and technique screens

1. New sequence screen with tags; Create opens the editor.
2. Sequence details screen.
3. Technique / position preview screen.

### Phase 3: Viewer and editor

1. Viewer chrome.
2. Editor chrome: top bar, camera pad, steps strip, hint, action bar.
3. Joint panel.
4. Save technique, Techniques and Positions sheets.
5. Hand editor.

### Phase 4: Cleanup

1. Delete files left unused by the rebuild and fix the barrels.
2. Translations: remove unused keys, verify used keys exist in en and pl.
3. Docs: CLAUDE.md component map and the threed-guide skill.

## Risks

- No device run in this gate: the editor layout (overlays on the GL canvas) is checked only by typecheck and by reading the boards; it needs a device QA pass.
- The joint panel shows X / Y / Z as Euler degrees converted from the stored quaternion; values round-trip through the existing slider math.

## Deviations from the boards

- The figure is the real `HumanModel` everywhere (operator: the boards' line drawing is only a stand-in).
- Techniques filter: no "Full body" chip; full-body poses are the Positions tab, so the chip would always be empty.
- Step captions ("Overhook grip, right arm") and "used in 3 sequences" are not stored: rows show "Step N", the preview "Saved 2 Oct".
- Also removed as unused (outside 3D): `MiniStat`, `StatusIndicator`, `OrderStatusBadge`, `useUnreadNotificationCount`. `students/types/db.ts` stays (types-folder convention).
- Unused exports inside live files (`updateSequence`, `updateSequenceCoverImage`, `updateTechnique`) stay, as in the earlier cleanup run.

## Progress

PR: #54

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Library

- [x] 1.1 Sequence tags and list data — 0f26cd8
- [x] 1.2 Library screen — 4a96b66

### Phase 2: Sequence and technique screens

- [x] 2.1 New sequence screen — 7c8df88
- [x] 2.2 Sequence details screen — b18feff
- [x] 2.3 Technique preview screen — 64f376f

### Phase 3: Viewer and editor

- [x] 3.1 Viewer chrome — 936aa71
- [x] 3.2 Editor chrome — 6c485ee
- [x] 3.3 Joint panel — 6c485ee
- [x] 3.4 Editor sheets — a62f72e
- [x] 3.5 Hand editor — 691a57f

### Phase 4: Cleanup

- [x] 4.1 Delete unused files — ac429d3
- [x] 4.2 Translations — 76063ab
- [x] 4.3 Docs — ce699ee
