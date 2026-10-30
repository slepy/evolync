---
layout: page
feature: organization
title: Organization
group: organization
accent: organization
icon: building
order: 20
summary: "The instructor's home: the organization dashboard with what comes next, the list of schools, and the tiles for orders, products and ranks. The context switcher moves between the organization and the schools where the user trains as a student."
purpose: "One starting point for everything the owner manages, and one switch for people who both teach and train."
who:
  - role: "Instructor (organization owner)"
    outcome: "Sees the organization at a glance, opens a school or a module, adds a school, switches to a school they train in"
  - role: "Student"
    outcome: "Switches between the schools they train in and joins another one"
rules:
  - "Every instructor owns **one organization**, created at sign-up (see [Sign up](./sign-up))."
  - "The **Next up** box shows the nearest event or training of the organization; the calendar icon opens the [Calendar](./calendar)."
  - "*Your schools* lists the organization's schools with their address; *Add new* opens a new school."
  - "*Manage* tiles: **Orders** (all schools), **Products**, **Grading**; the `+` of a tile opens a new item directly."
  - "A new school needs a name (2–100 characters); it opens on its own dashboard right after it is created."
  - "The **context switcher** (top left) lists the user's organization under *MANAGE* and every school where they are an active student under *TRAIN AS STUDENT*. A tap switches and closes; *Join another school* opens [Join a school](./join-school)."
  - "The chosen student context is remembered on the device."
  - "Everything on the dashboard is read from the local database and works offline."
messages:
  - situation: "School name too short"
    message: "Name must be at least 2 characters"
flows:
  - id: dashboard
    title: "Dashboard and schools"
    steps:
      - title: "Organization dashboard"
        text: "Amber header with the context switcher and the Synced pill, *Next up*, *Your schools* with *Add new*, then the *Manage* tiles."
        screen: Main
        api:
          - { id: sync-pull, x: 84, y: 5 }
      - title: "Event and training"
        text: "*Next up* lists the nearest event and training of the day."
        screen: MainC
      - title: "New school"
        text: "*Add new* under *Your schools*: name, *Create*. The school is written locally and synced; the app opens its dashboard."
        screen: School
        api:
          - { id: sync-push, x: 84, y: 9 }
  - id: switch
    title: "Switching context"
    steps:
      - title: "Switch context"
        text: "*MANAGE*: the own organization with the number of schools. *TRAIN AS STUDENT*: schools where the user is a student, with the city. A school of another organization missing on the device is fetched once from Supabase."
        screen: Switcher
        api:
          - { id: schools-by-id, x: 50, y: 78 }
      - title: "Student dashboard"
        text: "A school under *TRAIN AS STUDENT* opens the [Student dashboard](./student-dashboard) of that school."
        screen: Student
    diagram: |
      flowchart TD
        sw[Context switcher] --> org{Option}
        org -- organization --> od[Organization dashboard]
        org -- school as student --> mem[Remember the membership<br/>on the device]
        mem --> sd[Student dashboard]
        org -- Join another school --> join[Join a school]
---

<FeatureView>

## Code

| What | Where |
| --- | --- |
| Organization dashboard (route `/organization/dashboard`) | `app/organization/dashboard.tsx`, `src/modules/organization/components/Dashboard.tsx`, `hooks/useOrganizationDashboard.ts` |
| Owner guard of owner-only screens | `src/modules/organization/hooks/useRequireOrganizationOwner.ts` |
| New school (route `/school/create`) | `app/school/create.tsx`, `createSchool` in `src/modules/school/services/schoolService.ts`, `validation/schoolSchema.ts` |
| Context switcher and sheet | `src/core/components/ContextSwitcher/` (`ContextSwitcher`, `ContextSheet`, `useContextSwitch`) |
| Dashboard layout and header | `DashboardPage`, `DashboardHeader`, `NextUp`, `ModuleTileGrid` in `src/core/components` |

## Data

| Table | Columns |
| --- | --- |
| `organizations` | `owner_id`, `name` |
| `schools` | `organization_id`, `name`, `address` |

</FeatureView>
