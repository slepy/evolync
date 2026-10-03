# Planned Trainings

Brief: [briefs/2026-10-03-planned-training-sessions.md](briefs/2026-10-03-planned-training-sessions.md). Supersedes spec PR #14 (`2026-10-03-school-training-schedule.md`).

## 📝 TLDR
Owners have no place to plan future trainings. `training_sessions` belongs to the separate attendance module and records only past attendance. This spec proposes a new **planned trainings** feature:
- The owner taps **"+ Add training"**, gives it a short name, and picks **Recurring** (one or more "weekday + weekly/monthly" rules, up to an end date) or **Single** (several chosen dates at once, e.g. 3 Saturdays).
- The audience is the **organization, one school or selected people**, the same as events.
- A **location** is typed in or copied from a school's address.
- Trainings can be added only for the future. They appear on the **organization dashboard** (all of them, like events) and the **school dashboard** (only what concerns that school's students).

Attendance is not part of this work.

## Resolved assumptions (autonomous defaults)
The flow, audience, short name, multi-date single mode, location picker, future-only rule, dashboards and "no attendance" are the product owner's decisions (see the brief). These are the agent's defaults for what the brief left open:

| # | Question | Applied default | Why | Confirm? |
|---|----------|-----------------|-----|----------|
| Q1 | Where do trainings live, given that attendance must not be touched? | A **new `trainings` module and tables**, fully separate from `training_sessions`. | The owner wants attendance kept separate. Linking attendance to a planned training later only adds one optional column. | reversible |
| Q2 | What does "monthly" mean? | **Nth weekday of the month** (1st–4th or last), e.g. "1st Saturday". | This is how clubs repeat monthly sessions. Day-of-month can be added later as a new rule type. | reversible |
| Q3 | Does a recurring series end? | **An end date is required**, ≤ 6 months after the start, with an "Extend" action. All occurrences are created at save time. | No background generation, so it works fully offline and two devices cannot create duplicates. | reversible |
| Q4 | Cancel one occurrence (e.g. a holiday)? | `status: cancelled` on that training. It stays listed as "Cancelled". | Reuses the event status pattern, and cancelling is reversible. | reversible |
| Q5 | Edit semantics for a series? | "This training only", or "This and following": the original series ends the day before, and a new series with the new values replaces its future trainings. Past trainings are read-only. | This is the standard calendar behavior, and it never rewrites history. | reversible |
| Q6 | Is the location linked to the school? | **Copied.** Picking a school pastes its address as text and the owner can edit it. A later change to the school's address does not propagate. | Simplest option, and the owner can tweak it (e.g. "Hall B"). | reversible |
| Q7 | What do students see? | A read-only list of upcoming trainings in their audience, delivered as **Phase 3**. | The owner asked for dashboards. A student view is the natural next slice and is not blocking. | reversible |
| Q8 | Notifications? | None in this work. Any later notification must be sent once per series, not once per occurrence. | Avoids push spam from materialized series. | reversible |
| Q9 | Seminars and camps? | Stay in `events`. Trainings are single-day. | Events already cover multi-day, priced happenings. | reversible |

## 📝 Problem Statement
- Schools run on different rhythms. One trains Mon + Thu every week, another once a week. One keeps a fixed cycle, another sets a few dates for next month. Some trainings are for the whole organization, some for one school, some for one or a few people (private lessons).
- Nothing in the app stores a planned training. `events` has no recurrence and carries price/RSVP semantics. `training_sessions` is attendance-only (one per school per day, created when marking attendance).
- Owners therefore plan in external calendars or chats. The dashboards cannot show what is coming up.

## 📝 Proposed Solution
A new `trainings` module modelled on `events` for audience and RLS, with three tables:

- **`trainings`**: one row per concrete training on one day. These are the rows the dashboards and lists read.
- **`training_series`**: a recurring definition (name, audience, location, start date, end date and `rules`). Saving a series **materializes** its occurrences as `trainings` rows linked by `series_id`, in one atomic batch.
- **`training_invitees`**: the selected people for `visibility = 'whitelist'`, one row per (training, member). A series stores its invitees in `training_series.invitee_ids` and copies them into each occurrence.

Single mode writes N `trainings` rows (one per chosen date) with no series.

**Alternatives rejected:**
- **Spec PR #14** (a school-only schedule with computed occurrences): no audience, name or location, and no per-occurrence cancel.
- **Extending `events`:** wrong semantics (price, RSVP, multi-day).
- **Extending `training_sessions`:** the owner wants attendance kept separate.
- **Computed occurrences without stored rows:** they cannot carry a per-occurrence cancel or edit.

## 📝 Architecture
- **New module `src/modules/trainings/`**, with the standard layout and a barrel export. It imports `school` (repositories for the address picker) and `students` (the member picker, as events does). It never imports `attendance`.
- **Consumers:**
  - `organization/components/Dashboard.tsx` gets a "Trainings" stat card next to "Events".
  - `dashboard/components/SchoolDashboard.tsx` gets a "Trainings" stat card.
  - Both read hooks from `@/modules/trainings`.
- **Sync:**
  - `sync-organization.ts` pushes and pulls all three tables, scoped by `organization_id` (the same as `events`).
  - `sync-user.ts` (Phase 3) pulls the trainings a student can see.
- **Server:** a new migration adds the tables and RLS, mirroring `20260201000000_events_module.sql` (`is_org_owner`, plus a `can_view_training` function analogous to `can_view_event`).

```mermaid
flowchart LR
  F["+ Add training form (new)"] --> S[trainingService (new)]
  S --> R[(trainings / training_series / training_invitees — new)]
  R <--> SY[sync edge function (changed)]
  R --> OD[Organization Dashboard card + list (changed / new)]
  R --> SD[School Dashboard card + list (changed / new)]
  R -.-> ST[Student upcoming list (planned, Phase 3)]
  A[attendance / training_sessions (unchanged)]
```
All new logic lives in the new module. Existing code changes only in the two dashboards and the sync function. Attendance is untouched.

## 📝 Data Model
WatermelonDB schema version bump with `createTable` steps. The table schemas live in `src/modules/trainings/database/schema.ts`. The models are `Training`, `TrainingSeries` and `TrainingInvitee` in `src/database/models/`.

**`trainings`**
| Column | Type | Notes |
|---|---|---|
| `organization_id` | string, indexed | |
| `school_id` | string, optional, indexed | required when `visibility = 'school'` |
| `series_id` | string, optional, indexed | set for occurrences of a series |
| `name` | string | 1–60 chars |
| `date` | number, indexed | the day of the training, UTC-midnight timestamp (the same day convention as attendance) |
| `start_time` / `end_time` | string | `"HH:mm"`, wall-clock, with `end_time > start_time` |
| `location` | string, optional | ≤ 300 chars |
| `visibility` | string | `organization` \| `school` \| `whitelist` |
| `status` | string | `active` \| `cancelled` |
| `created_by` | string | |
| `created_at` / `updated_at` / `deleted_at` | number | |

**`training_series`**: `organization_id`, `school_id?`, `name`, `location?`, `visibility`, `invitee_ids` (JSON string array, for whitelist), `start_date`, `end_date` (UTC-midnight; at most 6 months after the start), `rules` (JSON string), `created_by` and the timestamps.

`rules` is an array of `{ weekday: 0–6, frequency: "weekly" | "monthly", weekOfMonth?: 1|2|3|4|-1, startTime: "HH:mm", endTime: "HH:mm" }`, validated by Zod on write. A `jsonb` column on the server holds it, with a `check (jsonb_typeof(rules) = 'array')`.

**`training_invitees`**: `training_id` (indexed), `school_member_id` (indexed) and the timestamps, with `unique (training_id, school_member_id)`.

**Supabase** `supabase/migrations/20261004000000_trainings.sql`:
- the three tables, with FKs to `organizations`, `schools` (set null), `training_series` and `school_members`;
- `check (visibility <> 'school' or school_id is not null)`;
- `check (end_time > start_time)`;
- indexes on `(organization_id, date)` and `updated_at`.

RLS:
- **Owner manages:** `is_org_owner(organization_id)`.
- **Members view:** `can_view_training(id)`, which allows organization visibility to members of any organization school, school visibility to members of that school, and whitelist to the invitees.

No PII beyond the existing member references is stored.

## 📝 API Contracts
`src/modules/trainings/services/trainingService.ts`. Every mutation runs one `database.write()` / `database.batch()` and then `sync().catch(console.error)`:

```ts
createSingleTrainings(input: SingleTrainingInput): Promise<Training[]>    // N dates → N rows (+ invitees)
createTrainingSeries(input: SeriesInput): Promise<{ series: TrainingSeries; trainings: Training[] }>
updateTraining(id: string, patch: TrainingPatch): Promise<Training>        // "this training only"
updateSeriesFrom(trainingId: string, input: SeriesInput): Promise<TrainingSeries> // "this and following" → split
extendSeries(seriesId: string, newEndDate: string): Promise<Training[]>
setTrainingStatus(id: string, status: "active" | "cancelled"): Promise<Training>
deleteTraining(id: string): Promise<void>                                  // soft delete
deleteSeriesFrom(trainingId: string): Promise<void>                        // future occurrences only

// src/modules/trainings/types/helpers.ts — pure
expandSeriesRules(rules: SeriesRule[], startDay: string, endDay: string): Array<{ day: string; startTime: string; endTime: string }>
```

**Validation** (`validation/trainingSchema.ts`, a Zod discriminated union on `mode: "single" | "recurring"`):
- `name` is required, at most 60 characters.
- Every date must be **≥ today** (device-local calendar day), and duplicate dates are rejected.
- Recurring mode needs `rules` to be non-empty, `weekOfMonth` set when the frequency is monthly, and `end_date >= start_date` with at most 6 months between them.
- Shared rules: the `HH:mm` format, `end_time > start_time`, a `schoolId` required when visibility is `school`, and `inviteeIds` non-empty when visibility is `whitelist`. These are the same cross-field rules as `createEventSchema`.
- Expanded duplicates (two rules that produce the same day + start time) are deduped.

**Hooks:**
- `useUpcomingTrainings(organizationId)` returns all upcoming trainings in the organization.
- `useSchoolUpcomingTrainings(schoolId)` returns upcoming trainings that concern the school.
- `useTraining(id)` and `useTrainingInvitees(id)`.
- `useSchoolsWithAddress(organizationId)` feeds the location picker.

## 📝 UI/UX
**Routes:**
- `app/organization/trainings/index.tsx` (list), `create.tsx`, `[trainingId]/index.tsx` and `[trainingId]/edit.tsx`, guarded by `useRequireOrganizationOwner`. These mirror `app/organization/events/*`.
- `app/school/[schoolId]/trainings/index.tsx`, the school-filtered list.

**Form ("+ Add training"):**
1. **Name** (short text).
2. **Recurring / Single** as a segmented control.
   - **Recurring** shows a list of rules. Each rule has weekday chips, a **Weekly / Monthly** toggle (Monthly adds a "1st, 2nd, 3rd, 4th, last" select) and a start–end time. "+ Add another day" adds a rule. Below the rules are the **From** and **Until** dates; From defaults to today and Until is required.
   - **Single** shows a calendar with multi-select (past days disabled) and a shared start–end time. The selected dates appear as removable chips.
3. **Audience**: the same control as the event form. It offers Organization / School (with a school select) / Selected people (with the member multi-select).
4. **Location**: a text field with a **"Use school address"** button. The button opens a sheet listing the organization's schools. Schools without an address are shown disabled and marked "no address". Tapping a school pastes its address into the field.
5. `SubmitComponent` with the dirty-flag pattern.

All strings go through `t()`. Keys are added to `en.json` and `pl.json` after a duplicate check, and existing weekday/audience keys from events are reused.

**Lists:**
- Upcoming trainings are grouped by day. Each card is a `BaseCard` showing the name, time, location and an audience badge. Series occurrences also show a ↻ icon. Cancelled trainings appear struck through with a "Cancelled" badge.
- The detail screen offers Edit (this / this and following), Cancel/Restore, Delete (this / this and following) and, for series, Extend.

**Dashboards:**
- **Organization** (`Dashboard.tsx`): a "Trainings" `DashboardStatCard` next to "Events" opens `/organization/trainings`. Its `badgeCount` is the number of trainings in the next 7 days.
- **School** (`SchoolDashboard.tsx`): a "Trainings" card opens `/school/[schoolId]/trainings`. The list shows only what concerns the school's students:
  - `visibility = 'school'` trainings for this school;
  - `organization` trainings;
  - `whitelist` trainings with at least one invitee who is a member of this school. For these, only this school's invitees are shown.

**Phase 3:** students see a read-only "Upcoming trainings" list of what they are in the audience of.

Mockups: none attached. The repo has no `om-prepare-test-env` descriptor, so screenshots and mockup renders could not be captured.

## 📝 Edge Cases & Failure Scenarios
| Scenario | Behavior |
|---|---|
| A past date is chosen (stale form left open over midnight) | Zod rejects it at save with an i18n message. Nothing is written. |
| Two rules produce the same day and time | Deduped, so one training is created. |
| "Last Friday" in a month with 5 Fridays | `weekOfMonth = -1` resolves to the 5th. |
| A series' Until date is more than 6 months out | Validation error that points to "Extend" for later. |
| A school has no address | Shown disabled in the picker. The owner types the location manually. |
| A school's address changes after the training was created | The training keeps its copied text (Q6). |
| An invited member is later archived or removed | The invitee row remains. The list shows them greyed out, the same as archived members elsewhere. |
| A school is soft-deleted | Its school-visibility trainings are hidden from the school list. On the organization list they show a "school removed" badge. |
| "This and following" edit or delete on a series | Only trainings dated ≥ the selected one are affected. Past trainings stay read-only. |
| Two devices edit the same training offline | The existing last-write-wins per row applies. |
| A series is created offline | The rows exist locally at once and sync later. No server generation is involved. |
| Sync fails | The local state stands. Sync retries on the next trigger. |
| DST week | No shift, because times are wall-clock strings on a calendar day. |

## 📝 Risks & Impact Review
- **New synced schema:** the change is additive only. No existing table, constraint or RLS changes, and attendance is untouched. Rollback means hiding the routes, or a down-migration before production data exists.
- **Stored contracts:** the `visibility`/`status` vocabularies and the `rules` JSON shape. Fields can be added safely. Renaming one needs a data migration, so `rules` carries the version implicitly through optional fields.
- **Sync scope:** three new organization-scoped tables in `sync-organization.ts`. The payload grows with the number of trainings, which is bounded by the 6-month series cap.
- **Phase 3** needs audience-scoped pulls in `sync-user.ts` (school, organization or invitee). This is more involved than events' participant-based pull and needs its own Deno tests.
- **Direction calls:** a separate table instead of `training_sessions` (Q1), and copied rather than linked location (Q6). Both are reversible.

## 📋 Phasing
- **Phase 1 — Data layer.** Tables, models, migrations (local and Supabase), RLS, organization sync, validation, `expandSeriesRules` and the service. Nothing is visible yet.
- **Phase 2 — Owner UI.** The form (with the location picker), organization and school lists, detail/edit and both dashboard cards.
- **Phase 3 — Student view.** Audience-scoped `sync-user` pull and a read-only upcoming list.

## 📋 Implementation Plan
**Phase 1**
1. Scaffold `src/modules/trainings/` (follow the `new-module` skill) with schema, models and their registration, plus a WatermelonDB migration (version bump, 3× `createTable`). Test: `npm run typecheck`, and the app migrates an existing DB.
2. Add the Supabase migration `20261004000000_trainings.sql` with the tables, checks, indexes, `can_view_training` and RLS. Test: apply it locally. The owner gets CRUD; a member of school A sees school-A and organization trainings but not school-B ones; an invitee sees their whitelist training and a non-invitee does not.
3. Add the three tables to `sync-organization.ts` for push and organization-scoped pull. Test: new cases in `supabase/functions/run-deno-tests.sh`.
4. Add the repositories (CRUD, batch create, `observeUpcomingByOrganization`, `observeUpcomingForSchool` with the audience filter, invitees; every query uses `Q.where("deleted_at", null)`). Test: unit tests for the school audience filter covering all three visibilities.
5. Add `expandSeriesRules` in `types/helpers.ts`. Test (`npm test`, `src/modules/trainings/__tests__/expandSeriesRules.test.ts`): Mon+Thu weekly over 4 weeks gives 8; monthly 1st Sat; last Fri in a 5-Friday month; dedupe; start/end bounds; output sorted.
6. Add the Zod `trainingSchema` and DTOs. Test: future-only, whitelist and school refinements, the 6-month cap and the time order.
7. Add `trainingService`: single, series, update this / from, extend, cancel/restore, delete this / from. Test: a series with 2 weekly rules over 4 weeks writes 8 trainings and their invitees atomically; invalid input writes nothing; "from" edits never touch earlier dates. The service is the only writer, so it also enforces "whitelist needs ≥ 1 invitee". That rule spans two tables and cannot be a SQL `CHECK`.
8. Add the hooks `useUpcomingTrainings`, `useSchoolUpcomingTrainings`, `useTraining`, `useTrainingInvitees` and `useSchoolsWithAddress` (all `.observe()`-backed) and export them from the module barrel. Test: hook unit tests emit again after a repository write.

**Phase 2**
9. Add translation keys to `en.json` and `pl.json` after a duplicate check. Test: typecheck and the locale parity test.
10. Add the `TrainingForm` shell (name, audience control reused from the event form, plain location text field) with **Single** mode (multi-date calendar, past days disabled, shared time), and the `app/organization/trainings/create.tsx` route. Test: create single trainings for each audience; a past day cannot be selected.
11. Add **Recurring** mode to the form: the rules editor (weekday chips, Weekly/Monthly with nth-weekday select, times, "+ Add another day") and the From/Until dates. Test: Mon+Thu weekly and "1st Saturday monthly" create the expected rows; Until beyond 6 months is rejected.
12. Add the **"Use school address"** sheet to the location field. Test: picking a school pastes its address; a school without an address is disabled.
13. Add the organization list and detail/edit routes, with the edit/delete "this / this and following", cancel/restore and extend actions. Test: each action produces the expected rows and earlier trainings are untouched.
14. Add the organization `Dashboard.tsx` "Trainings" stat card (with a 7-day badge). Test: it navigates and the count updates reactively; `npm run check:theme` passes.
15. Add the school list `app/school/[schoolId]/trainings/index.tsx` and the `SchoolDashboard.tsx` card. Test: school A's list shows its own trainings, organization trainings and whitelist trainings with school-A invitees (only those invitees listed), but not school-B trainings.

**Phase 3**
16. Add the audience-scoped trainings pull to `sync-user.ts`. Test: Deno cases per visibility, so a student never receives trainings outside their audience.
17. Add the student read-only "Upcoming trainings" screen and its entry point. Test: there are no edit affordances, and cancelled trainings are labeled.
