# School dashboard (board 2A · School, tile grid)

## Goal

Rebuild the school dashboard (`/school/[schoolId]/dashboard`) on the redesign components of board 2A: red context header, a red "Next up" header box that shows only this school's upcoming trainings, the module tile grid and the "School settings" wide row.

## Scope

- `src/modules/dashboard/components/SchoolDashboard.tsx` — rewritten on `DashboardPage` / `DashboardHeader` (school context, red glow), `NextUp` (`scope: school`, `show: ["trainings"]`), `ModuleTileGrid` + `ModuleTile` (Students, Attendance, Payments, Orders), wide settings row, `TechniqueNotebook`, `MainNav`.
- Orders tile behaves like on the organization dashboard (`useOrganizationDashboard`): pending (`PLACED`) count through `OrderRepository.observeCountBySchoolIds`, filtered to this school only.
- `src/modules/dashboard/hooks/useSchoolDashboard.ts` — orders count via `observeCountBySchoolIds([schoolId], PLACED)`; pure tile-subtitle logic tested.
- New shared `SettingsTile` (wide neutral row, board S "wide variant") in `src/core/components/ModuleTile/`.
- Context switcher in the header: organization + the owner's other schools.
- Translations (en + pl) for new tile descriptions only.

## Non-goals

- No change to the organization or student dashboards, the calendar, NextUp data logic or the orders module.
- No new nav "home" for the school (the Home tab keeps going to the organization dashboard).
- The canvas board 2A itself was not readable from this session (not shared), so the layout follows the design-mockups skill description of 2A.

## Implementation Plan

### Phase 1: Data and shared pieces

- 1.1 School dashboard hook: per-school pending orders count like the organization dashboard + pure subtitle helper with tests
- 1.2 Shared `SettingsTile` wide row in `src/core/components`

### Phase 2: Dashboard screen

- 2.1 Rewrite `SchoolDashboard` on the 2A layout (header, red Next up with trainings only, tiles, settings row, notebook, nav)
- 2.2 Translations (en + pl) and cleanup of the unused FAB / stat card

## Risks

- Board 2A not readable here; tile set (Students, Attendance, Payments, Orders) inferred from the skill and the existing modules.
- Removing the FAB drops the "edit today's attendance" shortcut; the attendance list still reaches it.

## Progress

PR: #27

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Data and shared pieces

- [x] 1.1 School dashboard hook: per-school pending orders count like the organization dashboard + pure subtitle helper with tests — 9b12029
- [x] 1.2 Shared `SettingsTile` wide row in `src/core/components` — 2a07bc0

### Phase 2: Dashboard screen

- [x] 2.1 Rewrite `SchoolDashboard` on the 2A layout (header, red Next up with trainings only, tiles, settings row, notebook, nav) — 1f19253
- [x] 2.2 Translations (en + pl) and cleanup of the unused FAB / stat card — 3dfad9f
