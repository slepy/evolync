---
layout: page
feature: grading
title: Ranks
group: organization
accent: grading
icon: award
order: 24
summary: "The organization's ranks (belts) in order, each with a name and a belt color. The rank of a student is set on the student card and shows as the colored corner of their avatar everywhere."
purpose: "One list of ranks for all schools of the organization, so every instructor and student sees the same belts."
who:
  - role: "Instructor (organization owner)"
    outcome: "Adds, renames, recolors and deletes ranks; sets a student's rank on the student card"
  - role: "Student"
    outcome: "Sees their rank color on their avatar"
rules:
  - "Ranks belong to the **organization**, not to a school."
  - "A rank has a **name** (1–50 characters, unique in the organization, ignoring case) and an optional **color** (hex, picked in a color picker)."
  - "A new rank goes to the end of the list; there is no reordering."
  - "Deleting a rank renumbers the remaining ones and **clears the rank of every student** who had it, in one transaction."
  - "Every member avatar in the app has a corner in the student's rank color (`MemberAvatar`)."
messages:
  - situation: "Delete a rank"
    message: "Are you sure you want to delete this rank?"
  - situation: "Name used by another rank"
    message: "A rank with this name already exists"
  - situation: "Name missing or too long"
    message: "Rank name is required · Rank name must be 50 characters or fewer"
  - situation: "No rank yet"
    message: "No ranks defined yet. Add your first rank to get started."
flows:
  - id: ranks
    title: "Ranks"
    steps:
      - title: "Your ranks"
        text: "From the organization dashboard: the ranks in order, each with its belt color. *Add new* opens a new rank, a row opens it for editing."
        screen: GradingList
      - title: "New rank"
        text: "NAME and COLOR; *Create* adds the rank at the end and syncs."
        screen: GradingAddSheet
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Color"
        text: "The COLOR field switches the sheet to the picker: saturation panel, hue slider and the hex value."
        screen: GradingColorPicker
      - title: "Edit or delete"
        text: "*Save* stores a new name or color; the trash deletes the rank after a confirmation and clears it from the students who had it."
        screen: GradingEditSheet
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Student's rank"
        text: "On the student card the rank sheet lists the ranks in their colors; the choice is stored with *Save*."
        screen: StudentRankSheet
---

<FeatureView>

## Code

| What | Where |
| --- | --- |
| Ranks (route `/organization/grading`, `?create=1` opens a new rank) | `app/organization/grading/index.tsx`, `src/modules/grading/components/GradingConfigScreen.tsx` |
| Add / edit sheet and color picker | `RankSheet.tsx`, `rankSheetState.ts`, `RankColorPicker.tsx` |
| Add, edit, delete | `src/modules/grading/services/gradingService.ts`, `validation/gradingSchema.ts` |
| Rank of a student | `StudentRankSheet.tsx` in the students module, `MemberAvatar` in `src/core/components` |

## Data

| Table | Columns |
| --- | --- |
| `organization_gradings` | `organization_id`, `name`, `order`, `color` |
| `school_members` | `current_rank_id` (the student's rank) |

Name uniqueness is checked on the device only.

</FeatureView>
