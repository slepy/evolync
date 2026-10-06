# Payments and Attendance (school) — rebuilt on the 13A–13C and 14A–14D1 boards

Engine: om-auto-create-pr (steps: 10, --loop: no)

## Goal

Rebuild the school Attendance screens (sessions list, session details, new session) and the school Payments screens (billing periods, period details with Amounts, edit payment sheet, new period) on the canvas boards, using the shared `src/core/components` and design tokens.

## Brief (operator, translated)

> Having the designs for "Payments — billing periods, mark who paid, edit amount (school)" and "Attendance — sessions list, mark who is present (school)", rebuild the screens on the new design. Remember the new elements we have in the style guide and core/components.

## Design source

Boards in `design/project/` (canvas sections "Attendance — sessions list, mark who is present (school)" and "Payments — billing periods, mark who paid, edit amount (school)"):

- 13A `AttendanceList.dc.html` — "Sessions" + Add new (attendance accent); sessions grouped by month (uppercase label "OCTOBER 2026"); row: calendar-check icon, "Thursday, 2 October", users icon + "7 of 10 present", rate chip (≥80% green, 50–79% amber, <50% red).
- 13B `AttendanceDetails.dc.html` — header "Thu, 2 Oct"; Status summary "10 members" / "7 present · 70%", legend Present (check) · Excused (file-pen) · Absent (x); hint "Tap a status to change it: Present, Absent, Excused."; member rows (avatar, name, email, 44px round status button); Save (attendance gradient) after a change.
- 13C `AttendanceCreate.dc.html` — header "Today, 4 Oct"; same as 13B with everyone Present; Create.
- 14A `PaymentsList.dc.html` — "Billing periods" + Add new (payments accent); row: credit-card icon, "October 2026" + CURRENT badge, "1 – 31 Oct · 6 of 10 paid", chip "6/10" (same thresholds); custom period: title "14 – 27 Jul 2026", "Custom period · 7 of 8 paid".
- 14B / 14B1 `PaymentDetails*.dc.html` — header = period title; Status summary "10 members" / "6 paid · 60%", legend Paid (card) · Pending (clock) · Cancelled (x), divider, collapsible "Amounts" (wallet icon) with COLLECTED / PENDING / CANCELLED chips per currency; hint; rows: avatar + name + "150 PLN · Transfer" (method only once paid), name opens the edit sheet, status button cycles Pending → Paid → Cancelled; Save after a change.
- 14C `PaymentEditSheet.dc.html` — sheet: avatar, name, "October 2026 · Pending", close; AMOUNT + CURRENCY fields; "Method" radio list (Cash "Paid in person at the school" / Transfer "Bank transfer" / Other "Any other way"); Save.
- 14D / 14D1 `PaymentCreate*.dc.html` — "New period"; "Period" radio list (This month / This week / This year with their date ranges, Custom "Pick the start and end dates"); Custom shows START / END date fields; Create.

## Scope

- Shared (`src/core/components`): `StatusButton` (44px round status toggle, extracted from the events participants screen and reused there); `ListRow` gets an optional `badge` next to the title (CURRENT); `StatusSummary` gets optional `children` under a divider (Amounts); `FormSheet` gets an optional `leading` (avatar in 14C); a rate → chip accent helper.
- `src/modules/attendance`: status style map (icon, colors, label) and pure session-list logic (month groups, counts, rate) with tests; screens `AttendanceSessionsScreen` (13A) and `AttendanceSessionScreen` (13B / 13C).
- `src/modules/payments`: status style map and pure logic (period title / subtitle / current, period presets, amounts by status and currency, row subtitle) with tests; screens `PaymentPeriodsScreen` (14A), `PaymentPeriodScreen` (14B / 14B1) + `PaymentEditSheet` (14C), `PaymentPeriodFormScreen` (14D / 14D1).
- Routes `app/school/[schoolId]/attendance/*` and `app/school/[schoolId]/payments/*` become thin wrappers.
- Old module UI no longer used (TrainingSessionCard, AttendanceListItem, AttendanceStats, PaymentCycleCard, PaymentCycleStats, PaymentRecordRow, PaymentMethodSelect) removed when nothing else imports it; translation keys added in en + pl, unused ones removed.

## Non-goals

- Data model, repositories, services, sync, Supabase changes.
- Student-side screens (`app/user/attendance.tsx`, `app/user/payments.tsx`) and the student-details Payments / Attendance tabs (16E / 16E1).
- Business rules: one session per day (Add new opens today's session if it exists), payment records only for members present at period creation.

## Implementation Plan

### Phase 1: Shared components and pure logic

- 1.1 Shared: `StatusButton`, `ListRow` badge, `StatusSummary` children, `FormSheet` leading, `rateAccent`; events participants use `StatusButton`.
- 1.2 Attendance status style + `sessionList.ts` (month groups, counts, rate) with tests.
- 1.3 Payments status style + `paymentPeriod.ts` (title, subtitle, current, presets, amounts) with tests.

### Phase 2: Screens

- 2.1 Attendance 13A sessions list + route.
- 2.2 Attendance 13B session details and 13C new session + routes.
- 2.3 Payments 14A billing periods + route.
- 2.4 Payments 14B / 14B1 period details + 14C edit payment sheet + route.
- 2.5 Payments 14D / 14D1 new period + route.

### Phase 3: Cleanup and gate

- 3.1 Remove old module UI and unused translation keys; en + pl keys complete.
- 3.2 CLAUDE.md shared-components line; full validation gate.

## Risks

- Week / year periods have no board of their own: the list row shows the date range as the title with "This week" / "This year"-style subtitle derived from the same rule as Custom (inference).
- Shared components gain optional props only; existing callers are unaffected.

## Progress

PR: #29

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Shared components and pure logic

- [x] 1.1 Shared: StatusButton, ListRow badge, StatusSummary children, FormSheet leading, rateAccent — 458d9b8
- [x] 1.2 Attendance status style and session-list logic with tests — e9eb1d6
- [x] 1.3 Payments status style and period logic with tests — b7dae4f

### Phase 2: Screens

- [x] 2.1 Attendance 13A sessions list — 6f08ac2
- [x] 2.2 Attendance 13B session details and 13C new session — deb86ab
- [x] 2.3 Payments 14A billing periods — 1061475
- [x] 2.4 Payments 14B / 14B1 period details and 14C edit payment sheet — 5e4d3e5
- [x] 2.5 Payments 14D / 14D1 new period — 48eab0b

### Phase 3: Cleanup and gate

- [x] 3.1 Remove old module UI and unused translation keys — 50ad60f
- [x] 3.2 CLAUDE.md shared-components line and full validation gate — 66502e5
