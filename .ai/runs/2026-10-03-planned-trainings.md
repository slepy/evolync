# Execution plan — Planned trainings

Source doc: .ai/specs/2026-10-03-planned-trainings.md
Engine: om-auto-create-pr (steps: 17, --loop: no)

## Goal

Owners can plan future trainings (recurring or single, for the organization, one school or selected people, with a location) and see them on the organization and school dashboards; students see the trainings they are in the audience of.

## Scope

- New `src/modules/trainings/` module (schema, models, repositories, service, validation, hooks, components).
- New WatermelonDB tables `trainings`, `training_series`, `training_invitees` (schema v20 + migration).
- New Supabase migration `20261004000000_trainings.sql` (tables, checks, indexes, `can_view_training`, RLS).
- Sync edge function: organization push/pull and audience-scoped student pull (new `sync-trainings.ts` + Deno tests).
- Routes under `app/organization/trainings/*`, `app/school/[schoolId]/trainings/index.tsx`, `app/user/trainings.tsx`.
- Dashboard cards on `organization/components/Dashboard.tsx`, `dashboard/components/SchoolDashboard.tsx` and the student dashboard.
- Translations in `en.json` / `pl.json`.

## Non-goals

Attendance / `training_sessions` (untouched), prices or payments, open-ended recurrence or background generation, notifications, migrating `events`, changing the events module.

## Implementation decisions

- The audience control is re-implemented inside the trainings module (reusing the events i18n keys and `SelectableMemberCard`) instead of extracting it from `EventForm`, so the events module stays untouched as the spec requires.
- Days are `YYYY-MM-DD` strings in DTOs and UTC-midnight timestamps in the DB (attendance convention; `convertToSupabaseRecord` already maps `date`/`start_date`/`end_date` to SQL `date`).
- `rules` / `invitee_ids` are JSON strings locally and `jsonb` on the server; `sync-trainings.ts` converts in both directions.
- Sync pushes for trainings are scoped to the caller's organization (the edge function uses the service role, so RLS does not guard pushes).
- No calendar library exists; a small multi-select month grid is added in the trainings module. Times use a native time picker on iOS/Android and an `HH:mm` text field on web.

## Risks

- New synced schema (additive). Older clients ignore the new tables.
- Supabase migration and Deno sync tests cannot be applied against a live database in this environment; covered by Deno unit tests with a fake client where possible (noted on the PR if Deno is unavailable).
- `jsonb` conversion of `rules`/`invitee_ids` is a stored contract.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Data layer

- [x] 1.1 Scaffold trainings module with schema, models, registration and WatermelonDB migration — 073fe14
- [x] 1.2 Supabase migration with tables, checks, indexes, can_view_training and RLS — 0890a5a
- [x] 1.3 Organization sync push and pull for the three tables — f74036c
- [x] 1.4 Repositories with upcoming and school audience queries — 519f49f
- [x] 1.5 expandSeriesRules helper — 1f57d0d
- [x] 1.6 Zod trainingSchema and DTOs — 6146187
- [x] 1.7 trainingService mutations — 42d53c6
- [x] 1.8 Observable hooks and barrel export — 3a89fd6

### Phase 2: Owner UI

- [x] 2.1 Translation keys — c9c02b8
- [x] 2.2 TrainingForm shell with Single mode and create route — 0c32e81
- [x] 2.3 Recurring mode rules editor — 26a8c25
- [x] 2.4 Use school address sheet — d98c83e
- [x] 2.5 Organization list, detail and edit routes with series actions — ad615c4
- [x] 2.6 Organization dashboard Trainings card — 995889b
- [x] 2.7 School trainings list and SchoolDashboard card — 7008f10

### Phase 3: Student view

- [ ] 3.1 Audience-scoped trainings pull in sync-user
- [ ] 3.2 Student upcoming trainings screen and entry point
