---
layout: page
feature: school
title: School dashboard
group: school
accent: school
icon: house
order: 10
summary: "One school's home for the instructor: the school's next trainings, tiles for Students, Payments, Orders and Attendance, and the school settings with the name, address and default payment amount."
purpose: "Everything about one school in one place, in the school's red."
who:
  - role: "Instructor (organization owner)"
    outcome: "Opens a school's modules, adds items from the tiles, changes the school's name, address and payment defaults"
rules:
  - "A school dashboard opens from *Your schools* on the [organization dashboard](./organization)."
  - "*Next up* shows the school's upcoming trainings; the calendar icon opens the school's [Calendar](./calendar)."
  - "Tiles: **Students**, **Payments**, **Orders**, **Attendance**, each with a short status line; the `+` of a tile opens a new item directly."
  - "*School settings*: SCHOOL NAME (2–100 characters), ADDRESS (up to 500), DEFAULT AMOUNT and CURRENCY. *Save* appears after the first change."
  - "The default amount is used for **new** billing periods only; existing periods keep their amounts (see [Payments](./payments))."
  - "The school address can be used as the location of a training (*Use school address*)."
messages:
  - situation: "Under the payment defaults"
    message: "Changing the defaults does not update periods that already exist."
flows:
  - id: dashboard
    title: "School dashboard"
    steps:
      - title: "School"
        text: "Back button, school name and Synced pill; the red *Next up* box with the school's trainings; the module tiles and the *School settings* row."
        screen: School
      - title: "School settings"
        text: "*Basic info* (name, address) and *Payment defaults* (amount, currency). *Save* writes the school and its settings and syncs."
        screen: SchoolSettingsEdited
        api:
          - { id: sync-push, x: 84, y: 9 }
---

<FeatureView>

## Code

| What | Where |
| --- | --- |
| School dashboard (route `/school/{schoolId}/dashboard`) | `app/school/[schoolId]/dashboard/index.tsx`, `src/modules/dashboard/components/SchoolDashboard.tsx` |
| Tile status lines | `src/modules/dashboard/hooks/schoolTileSubtitles.ts` |
| School settings (route `/school/{schoolId}/settings`) | `app/school/[schoolId]/settings.tsx`, `src/modules/school/components/SchoolSettingsScreen.tsx`, `services/schoolSettingsService.ts`, `validation/schoolSchema.ts` |

## Data

| Table | Columns |
| --- | --- |
| `schools` | `organization_id`, `name`, `address` |
| `school_settings` | `school_id`, `default_payment_amount`, `default_currency` |

</FeatureView>
