---
layout: page
feature: tags
title: Tags
group: notebook
accent: tags
icon: tag
order: 42
summary: "The user's own labels (Guard, Sweeps, Footwork…) for notes and 3D sequences: one list to add, rename and delete them, a sheet to pick them, and chips to filter by them."
purpose: "Groups techniques the way the user thinks about them, across notes and 3D."
who:
  - role: "Any signed-in user"
    outcome: "Keeps their own tag list and tags notes and 3D sequences"
rules:
  - "Tags are **private** to their user and shared by notes and 3D sequences."
  - "A name is 1–30 characters and **unique per user**, ignoring case (*guard* = *Guard*)."
  - "Tags always show in the Tags rose, whatever color they were saved with."
  - "Deleting a tag asks first and removes it from the list and from every note and sequence."
  - "A *TAGS* field (note, new 3D sequence) shows the chosen tags with `×` and a dashed *Add tag* that opens the picker; the picker's *Add new* creates a tag and checks it."
messages:
  - situation: "Delete a tag"
    message: "Delete tag?"
  - situation: "Name used"
    message: "A tag with this name already exists"
  - situation: "Name too long"
    message: "The name can have at most 30 characters"
  - situation: "No tag yet"
    message: "No tags yet. Tap Add new to create your first one."
flows:
  - id: tags
    title: "Tags"
    steps:
      - title: "Technique notebook"
        text: "The dashboard's notebook section has *Open notebook* and *Tags*; `+` adds a tag directly."
        screen: TechniqueNotebook
      - title: "Your tags"
        text: "One row per tag; *Add new* opens the add sheet, a row the edit sheet."
        screen: TagsList
      - title: "Add tag"
        text: "NAME, *Create*; stored locally and synced."
        screen: TagsAddSheet
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Edit tag"
        text: "Rename with *Save*; the trash deletes the tag after a confirmation."
        screen: TagsEditSheet
        api:
          - { id: sync-push, x: 84, y: 9 }
---

<FeatureView>

## Code

| What | Where |
| --- | --- |
| Tags list (route `/tags`) | `app/tags/index.tsx`, `src/modules/tags/components/TagsListScreen.tsx`, `TagSheet.tsx` |
| Picker and field | `TagPickerSheet.tsx`, `TagsField.tsx`, `hooks/useEntityTags.ts` |
| Create, rename, delete, attach | `src/modules/tags/services/tagService.ts`, `validation/tagSchema.ts` |
| Server sync | `supabase/functions/sync/sync-tags.ts` |

## Data

| Table | Columns |
| --- | --- |
| `tags` | `user_id`, `name`, `color` |
| `taggables` | `tag_id`, `taggable_id`, `taggable_type` (note, 3D sequence) |

</FeatureView>
