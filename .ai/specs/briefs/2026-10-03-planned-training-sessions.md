# Plan future trainings: recurring or single, for an organization, a school or selected people, shown on the organization and school dashboards

- Date: 2026-10-03
- Category: feature
- Priority signal: medium. Owners have nowhere to plan trainings. Requested directly by the product owner.
- Risk signal: medium. New synced tables, RLS and sync scoping mirroring `events`. The attendance module is untouched.
- Routing: Next: om-auto-write-spec "Plan future trainings — recurring (weekly/monthly) or single multi-date, audience organization/school/selected people, short name, location with school-address picker, on org + school dashboards; no attendance; supersedes PR #14 — brief: .ai/specs/briefs/2026-10-03-planned-training-sessions.md"

## Problem

Owners need to plan trainings, and every school works differently. One trains 2x a week, another 1x a week. One keeps a fixed cycle, another sets a few dates for next month (e.g. 3 Saturdays). A training can target the whole organization, one school, or selected people (a private lesson, a small group). The app has no place for planned trainings: `training_sessions` belongs to the separate attendance module and only records past attendance.

## Agreed direction

The product owner wants this flow:

1. **"+ Add training"** opens a form with a **short name**.
2. The owner picks **Recurring** or **Single**.
   - **Recurring:** pick a day and a frequency (**weekly** / **monthly**). More day + frequency rules can be added.
   - **Single:** select several dates at once (e.g. 3 Saturdays in a month).
3. **Audience, like events:** whole **organization** / one **school** / **selected people** (one or many).
4. **Location:** a free-text field, plus **"Use school address"**, which opens a list of schools. Picking one copies that school's address into the field.
5. **Future only:** trainings can be added only for today or later.
6. **Shown on dashboards:**
   - **Organization dashboard:** like events, all trainings.
   - **School dashboard:** only what concerns that school's students. That means trainings for this school, organization-wide trainings, and selected-people trainings that include this school's students; only those students are shown.

**Attendance is out of scope.** It has its own module (`attendance` / `training_sessions`) and this work does not touch it.

**Rejected:**
- **Spec PR #14:** school-only, no audience, no name or location. Its occurrences are computed rather than stored, so they cannot be cancelled one by one.
- **Extending `events`:** events carry price/RSVP semantics, which regular trainings do not need.
- **Extending `training_sessions`:** that table belongs to attendance, and the owner wants attendance kept separate for now.
- **Build nothing:** owners keep planning outside the app.

## Resolved unknowns

The flow, audience, name, multi-date single mode, location picker, future-only rule, dashboards and "no attendance" come from the product owner. The rows marked *(default)* were filled by the agent at the owner's request. The spec should surface them as overridable defaults.

| Question | Answer |
|----------|--------|
| Touch attendance / `training_sessions`? | No (owner). |
| Where do trainings live? | *(default)* A new table separate from attendance. A future link from attendance to a planned training would be additive. |
| Recurring vs single? | Both, in one "+ Add training" form (owner). |
| Several rules per recurring training? | Yes (owner). |
| Single trainings on several dates? | Yes, by multi-selecting dates (owner). |
| Audience? | Organization / school / selected people, like events (owner). |
| Location? | Free text plus a "use school address" list that copies the address (owner). Copied, not linked *(default)*. |
| Past dates? | Not allowed: future only (owner). |
| Dashboards? | Organization (all, like events) and school (only its students) (owner). |
| What does "monthly" mean? | *(default)* The nth weekday of the month (1st–4th or last). |
| End of a recurring series? | *(default)* Required, ≤ ~6 months, extendable. Occurrences are created at save time. |
| Cancel one occurrence? | *(default)* `status: cancelled` on that training. |
| Edit semantics? | *(default)* "This training only" or "this and following" (the series is split). Trainings that have already happened are read-only. |
| What do students see? | *(default)* A read-only list of upcoming trainings in their audience, delivered as the last phase. |
| Notifications? | *(default)* None in this work. |
| Seminars/camps? | *(default)* Stay in `events`. |

## Non-goals

- Attendance, and any change to `training_sessions` / `attendance_records`.
- Prices or payments per training.
- Open-ended recurrence and background generation.
- Notifications about trainings.
- Migrating `events` into trainings.

## Affected areas (if known)

- A new module for planned trainings: tables, model, repository, service, validation and form.
- A Supabase migration with RLS mirroring `events` (`20260201000000_events_module.sql`: `is_org_owner`, a `can_view_event`-like function).
- `supabase/functions/sync/sync-organization.ts` (organization-scoped pull, like events) and `sync-user.ts` (audience-scoped pull, in the student phase).
- `src/modules/organization/components/Dashboard.tsx` (a new stat card next to "Events") and `src/modules/dashboard/components/SchoolDashboard.tsx` (a new stat card).
- New routes under `app/organization/` and `app/school/[schoolId]/`.
- `schools.address` is the source for the location picker.
- PR #14 is superseded.
