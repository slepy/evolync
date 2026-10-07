# Note rows as chat bubbles (T4 / T4A)

Source doc: canvas boards "T4 · Note" (`NoteDetails.dc.html`) and "T4A · Note after a change" (`NoteDetailsEdited.dc.html`), revised 2026-10-07.

## Goal

Show each row of a descriptive note the way the revised T4 / T4A boards do: Person 1 in a cyan bubble on the left, Person 2 in a neutral bubble on the right, the leader's bubble on top, a swap button between them that changes who leads.

## Scope

- `NoteRowCard`: replace the side-by-side cells and → / ← arrow with two stacked bubbles (86% wide, chat-style corner, `PERSON N · LEADS` / `PERSON N` label above an auto-growing text area), leader first, centered 44px swap button (refresh icon, notebook fill) between them. No card around the row; header (number, "Person N leads", trash) unchanged.
- `NoteForm`: drop the "PERSON 1 / PERSON 2" column header, rows 26px apart, hint "Tap the swap icon to change who leads".
- Tokens: bubble fill (cyan 10%) and border (cyan 30%) for Person 1.
- Translations (en + pl): hint, bubble labels, placeholders "What does Person N do?", swap label naming who will lead.
- T4A: field in focus has the 1.5px cyan border; Save in Notebook cyan — already in place, kept.

## Non-goals

- Data model / sync: `direction` keeps its stored values (`right` = Person 1 leads).
- T3 (new note) gets the same row look since it shares `NoteForm`; no other screen changes.

## Risks

- Auto-grow of a multiline input differs per platform; rely on React Native multiline growth with a min height of one line.

## Implementation Plan

### Phase 1: Bubble rows

- 1.1 Tokens, translations and `NoteRowCard` / `NoteForm` on the new layout, unit test for the leader-first order.

## Progress

PR: #42

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Bubble rows

- [x] 1.1 Tokens, translations and NoteRowCard / NoteForm on the new layout — c793ad0
