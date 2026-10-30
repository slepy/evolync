---
layout: page
feature: trainings
title: Trainings
group: organization
accent: trainings
icon: activity
order: 22
summary: "The training schedule: single trainings on chosen days or recurring series (weekly, or the nth weekday of the month) up to 6 months ahead, for the organization, one school or selected members. Series can be edited from a given day on, extended and cancelled day by day."
purpose: "Students and instructors see when and where the next training is, in the calendar and on the dashboard, also offline."
who:
  - role: "Instructor (organization owner)"
    outcome: "Plans, edits, extends, cancels and deletes trainings"
  - role: "Student"
    outcome: "Sees the trainings meant for them in the calendar and on the dashboard, read-only"
rules:
  - "A training has a name (up to 60 characters), a day, start and end time, an optional location (up to 300 characters, or *Use school address*) and an audience: **entire organization**, **one school** or **selected members**."
  - "**Single**: one training per chosen day. **Recurring**: one or more *Repeat on* rules (weekly on chosen weekdays, or monthly on the 1st–4th or last weekday), each with its own times, from *From* to *Until*."
  - "A series lasts **at most 6 months**. *Extend* continues it up to 6 months past its current end; beyond the series' own 6-month window a continuation series is started."
  - "Times are wall-clock *HH:mm*, so a change of daylight-saving time never moves a training."
  - "**Past trainings are read-only.**"
  - "Editing or deleting a training of a series first asks: **this training only** or **this and following**. *This and following* ends the old series the day before and replaces the rest with a new series; earlier trainings are never touched, cancelled days stay cancelled."
  - "*Cancel* marks one training as cancelled (it stays in the calendar) and can be undone; delete removes it."
  - "The dashboard counts the trainings of the next 7 days."
messages:
  - situation: "Delete one training"
    message: "Delete this training? This cannot be undone."
  - situation: "Delete this and following"
    message: "Delete this and all following trainings of the series? Earlier trainings stay."
  - situation: "Edit a training of a series"
    title: "Edit recurring training"
    message: "Kids Judo is part of a series."
flows:
  - id: single
    title: "Single training"
    steps:
      - title: "New training"
        text: "From the calendar's `+` or the dashboard: name, *Single*, the day (taken from the day picked in the calendar), start and end, location, *Who is it for?*."
        screen: TrainingCreateSingle
      - title: "Create"
        text: "One training per chosen day, with its invitees for *selected members*, written in one transaction and synced."
        screen: TrainingDetails
        api:
          - { id: sync-push, x: 84, y: 9 }
  - id: recurring
    title: "Recurring series"
    steps:
      - title: "Repeat on"
        text: "*Recurring* shows the *Repeat on* rules: Weekly with weekdays or Monthly with the week of the month, each with start and end; the red × removes a rule. *From* and *Until* bound the series (at most 6 months)."
        screen: TrainingCreate
      - title: "Create"
        text: "The series and all its trainings are generated on the device and written at once, then synced."
        screen: TrainingDetails
        api:
          - { id: sync-push, x: 84, y: 9 }
    diagram: |
      flowchart TD
        rules[Repeat on rules<br/>From – Until] --> expand[Expand to days<br/>drop duplicates day + time]
        expand --> write[Series + trainings<br/>+ invitees in one write]
        write --> sync[Sync]
        sync --> cal[Calendars of the audience]
  - id: series
    title: "Edit, extend, cancel"
    steps:
      - title: "Training"
        text: "Date and time, location, audience and the series card with *Extend*; *Edit* and *Cancel* below, trash in the header."
        screen: TrainingDetails
      - title: "This or following"
        text: "Edit and delete of a series training ask first: this training only, or this and all following from its day."
        screen: TrainingScopeSheet
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Extend"
        text: "A new *Until* up to 6 months ahead; the sheet shows how many trainings it adds."
        screen: TrainingExtendSheet
        api:
          - { id: sync-push, x: 84, y: 9 }
---

<FeatureView>

## Code

| What | Where |
| --- | --- |
| New / edit training (routes `/organization/trainings/create`, `…/{trainingId}/edit`) | `src/modules/trainings/components/TrainingFormScreen.tsx`, `trainingFormState.ts`, `SeriesRuleCard.tsx`, `SchoolAddressSheet.tsx` |
| Training details (route `/organization/trainings/{trainingId}`) | `TrainingDetailsScreen.tsx`, `TrainingScopeSheet.tsx`, `ExtendSeriesSheet.tsx` |
| Create, edit, extend, cancel, delete | `src/modules/trainings/services/trainingService.ts` |
| Days and series expansion (pure logic) | `src/modules/trainings/types/helpers.ts` |
| Server sync | `supabase/functions/sync/sync-trainings.ts` |

## Data

| Table | Columns |
| --- | --- |
| `training_series` | `organization_id`, `school_id`, `name`, `location`, `visibility`, `invitee_ids`, `start_date`, `end_date`, `rules` (JSON), `previous_series_id` |
| `trainings` | `organization_id`, `school_id`, `series_id`, `name`, `date`, `start_time`, `end_time`, `location`, `visibility`, `status` (`active` / `cancelled`) |
| `training_invitees` | `training_id`, `school_member_id` |

A planned training is not a session of the [attendance register](./attendance).

## Sync

- The organization owner pushes and pulls the trainings of their organization; the server keeps a push within the caller's organization and drops a series link to another organization.
- A student pulls, read-only, the trainings they are in the audience of: the organization, their school, or invited.
- Trainings send no notifications.

</FeatureView>
