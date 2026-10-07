# Student payments & attendance (read-only) and Join a school

Source doc: Claude Design canvas boards StudentPayments, StudentAttendance, JoinSchool, JoinSchoolFilled, JoinSchoolError, JoinSchoolOffline, JoinSchoolSent, NoSchool (local `.dc.html` copies)

## Goal

Rebuild the student's own Payments and Attendance screens (opened from the student dashboard tiles) and the Join a school flow on the new boards, using the styleguide and `src/core/components`.

## Scope

- `app/user/payments.tsx`, `app/user/attendance.tsx` → read-only screens: `SubScreenPage`, static `StatusSummary` on top, `ListSection` + `ListCard` rows with a `StatusBadge` on the right (payments: amount over the badge, CURRENT tag, "1 – 31 Oct · Transfer"; attendance: grouped by month, "School · 18:00").
- `app/school/join.tsx` → Join a school (empty / filled / error / offline) and Request sent; reached from the No school card, the context sheet ("Join another school") and after sign-up.
- Core: `AuthIntro` `centered` variant, new `StepList` ("How it works") and `StatusHero` ("Request sent") components.
- `joinSchool` service returns the school id so the Sent screen can show the school.
- Translations (en + pl), CLAUDE.md component map.

## Non-goals

- No change to the instructor screens, the join-request approval flow or the database schema.
- No new Settings entry (the Settings board has no join row; "Join another school" lives in the context sheet).

## Implementation Plan

### Phase 1: Core components
- 1.1 `AuthIntro` centered variant, `StepList`, `StatusHero` (+ tests)

### Phase 2: Student payments & attendance
- 2.1 Pure helpers: payment summary (to pay per currency), attendance grouping by month (+ tests)
- 2.2 Student Payments screen
- 2.3 Student Attendance screen

### Phase 3: Join a school
- 3.1 Join a school screen (empty / filled / error / offline) and Request sent
- 3.2 Entry points: sign-up, No school card, context sheet; back without history goes to the dashboard

### Phase 4: Docs
- 4.1 Translations check, CLAUDE.md component map

## Risks

- Session start time: `training_sessions.date` holds the session datetime; when it is midnight the time is omitted.
- The school of a pending request belongs to another organization; its name is fetched via `findByIdOrFetchFromSupabase` (existing allowed path), organization name may be unavailable → subtitle falls back to the address.

## Progress

PR: #38

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Core components

- [x] 1.1 AuthIntro centered variant, StepList, StatusHero — 4311541

### Phase 2: Student payments & attendance

- [x] 2.1 Pure helpers for summary and grouping — 126eeea
- [x] 2.2 Student Payments screen — a9a5f87
- [x] 2.3 Student Attendance screen — a9a5f87

### Phase 3: Join a school

- [x] 3.1 Join a school screen and Request sent — d4e89ff
- [x] 3.2 Entry points and back navigation — d4e89ff

### Phase 4: Docs

- [x] 4.1 Translations and CLAUDE.md component map — 35620fd

## Decisions

- The Settings board has no Join row, but the brief names Settings as an entry point: a "Join a school" row (ticket, school accent) was added under Appearance.
- The organization name is not available for a school of another organization; the Request sent row shows the school address under the name.
- Paid legend icon: Wallet, as on the StudentPayments board (the instructor 14B summary keeps CreditCard).
