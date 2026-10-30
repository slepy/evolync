---
layout: page
feature: notes
title: Notes
group: notebook
accent: notebook
icon: book-open
order: 40
summary: "Private descriptive notes of techniques: a title, tags, and rows written as a dialogue between Person 1 and Person 2, with who leads in each step. Every user has their own notebook, whatever their role."
purpose: "Lets anyone who trains write a technique step by step, the way it is taught in pairs, and find it again by tag or search."
who:
  - role: "Any signed-in user"
    outcome: "Writes, edits, tags, searches and deletes their own notes; nobody else sees them"
rules:
  - "Notes are **private**: synced only to their author, filtered by `user_id` on the server."
  - "A note has a **title** (required, up to 200 characters), **tags** and **rows**."
  - "Each row holds what **Person 1** and **Person 2** do; the swap button changes who leads, and the leader's bubble is on top."
  - "Blank rows are not stored; rows are renumbered in the order shown when saving."
  - "*Save* appears only once the title, the tag set or any row differs from the saved note."
  - "The list filters by **tag chips** (*All*, then the user's tags) and **search** in the title and the tag names, ignoring case and diacritics."
  - "Deleting a note deletes its rows, after a confirmation."
  - "The *Notebook* tab of the bottom bar lists the ways to write: *Descriptive notes* with the count, [3D](./threed) and *Video* (coming soon)."
messages:
  - situation: "Delete a note"
    title: "Delete note"
    message: "Delete this note with all its rows?"
  - situation: "No title"
    message: "Title is required"
  - situation: "Empty notebook"
    message: "Write a technique step by step: what Person 1 does and how Person 2 reacts."
flows:
  - id: write
    title: "Writing a note"
    steps:
      - title: "Notebook"
        text: "The *Notebook* tab: *Descriptive notes*, *3D*, *Video*."
        screen: NotesNotebook
      - title: "Descriptive notes"
        text: "Search, tag chips and *Your notes* with the date and tags of each; *Add new* opens a new note."
        screen: NotesList
      - title: "New note"
        text: "TITLE, TAGS (dashed *Add tag*) and the first empty row; *Create* stores the note, its tags and its non-empty rows."
        screen: NoteCreate
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Tags"
        text: "The tags sheet checks the user's tags; *Add new* creates one (see [Tags](./tags))."
        screen: NoteTagsSheet
      - title: "Note"
        text: "Rows as chat bubbles, Person 1 cyan on the left, Person 2 on the right; the trash of a row removes it. *Save* appears after a change."
        screen: NoteDetailsEdited
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "By tag"
        text: "A tag chip narrows the list to the notes with that tag."
        screen: NotesListFiltered
---

<FeatureView>

## Code

| What | Where |
| --- | --- |
| Notebook tab (route `/techniques`) | `app/techniques/index.tsx`, `src/modules/techniques/components/NotebookScreen.tsx` |
| Notes list (route `/techniques/notes`) | `NotesListScreen.tsx`, `noteList.ts`, `hooks/useNoteList.ts` |
| New note / note (routes `…/notes/create`, `…/notes/{documentId}`) | `NoteCreateScreen.tsx`, `NoteDetailsScreen.tsx`, `NoteForm.tsx`, `NoteRowCard.tsx`, `noteRows.ts` |
| Create, save, delete | `src/modules/techniques/notes/services/noteService.ts` |
| Server sync | `supabase/functions/sync/sync-notes.ts` |

## Data

| Table | Columns |
| --- | --- |
| `technique_note_documents` | `user_id`, `title`, `description` |
| `technique_note_rows` | `document_id`, `order_index`, `person_1_text`, `person_2_text`, `direction` (`right`: Person 1 leads, `left`: Person 2) |

</FeatureView>
