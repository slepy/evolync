# Student dashboard (boards 4 / 5) and context switcher (board 3)

## Goal

Rebuild the student dashboard on the design boards "4 · Student in a school" and "5 · Student without a school", and bring the context switcher in line with "3 · Context switcher", which was missing "Join another school".

## Scope

- `src/modules/dashboard`: `StudentDashboard` (4 / 5), `NoSchoolCard` (5); `app/user/dashboard.tsx` becomes a thin route.
- `src/core/components/ContextSwitcher`: 52px pill with context kicker and up/down chevron, neutral variant; `ContextSheet` with MANAGE / TRAIN AS STUDENT sections and the Join another school row; `useContextSwitch` shared by both dashboards, option building in a pure, tested `contextOptions.ts`.
- `DashboardPage`, `BottomNav` / `MainNav`: neutral page context (slate glow, white nav pill).
- Organization dashboard uses the shared switcher hook; the switcher always opens (join is always offered).
- Translations (en + pl), CLAUDE.md component notes.

Source boards: local `.dc.html` copies of `Student`, `NoSchool`, `Switcher` (claude design canvas).

## Non-goals

- Join-school screen (`app/school/join.tsx`) redesign.
- Payments / attendance / orders screens for students.
- Removing legacy `DashboardStatCard` / `HeaderSelector`.

## Implementation Plan

### Phase 1: Dashboards and switcher

- 1.1 Student dashboard 4 / 5, context switcher 3, neutral page context, translations.
- 1.2 Extract switcher option building to a pure function with unit tests.

## Risks

- Pending / rejected join requests are not on boards 4 / 5; kept as a "Waiting for approval" list so a student sees the result of joining.
- Not exercised on a device in this run; manual QA pending.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Dashboards and switcher

- [ ] 1.1 Student dashboard 4 / 5, context switcher 3, neutral page context, translations
- [ ] 1.2 Extract switcher option building to a pure function with unit tests
