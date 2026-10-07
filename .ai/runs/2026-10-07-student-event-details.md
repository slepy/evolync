# Student events on the new design, `+` on the Orders tile, one select check

## Goal

The student dashboard's Orders tile gets the `+` quick action, a calendar event opens a redesigned event details screen (the old pre-redesign events list goes away), and every select sheet marks the chosen row with the same round check the context switcher uses, sized like the 24px checkbox of "SELECT MEMBERS".

## Brief (user, PL)

1. Dashboard studenta: kafel zamówienia powinien mieć "+".
2. Dashboard studenta → kalendarz → szczegóły wydarzenia pokazują stare ekrany (sprzed przebudowy designu) — uaktualnić. Selecty różnią się po otwarciu: context switch ma check w kółku, a select rangi studenta ma większy check i tło. Select ma mieć check w kółku, ikona wielkości checkboxa z multiple selectu "SELECT MEMBERS" ze styleguide'u.

## Scope

- `StudentDashboard`: Orders tile `addHref="/user/orders/create"`.
- Events (student): new `StudentEventDetailsScreen` (`/user/events/[eventId]`) on the 10C layout — name + day chip, cancelled chip, note, date / location card, price — read-only for the event, plus a "Your participation" choice (Attending / Absent; Paid shown locked). `/user/events` rebuilt on `SubScreenPage`: Upcoming / History `ViewSwitch`, static `StatusSummary`, rows with a `StatusBadge`, a row opens the details. Calendar rows open the details of that event.
- Core: `ListCheck` becomes a 24px round check (accent ring + check), used by every select sheet and by `ContextSheet`; select rows lose the selected-row fill.

## Non-goals

- No instructor event screens change (10A–10E stay).
- No new data model, no sync changes; participation writes go through the existing `updateParticipantStatus` service.
- No board exists for the student event screens: they reuse the 10C / student-list patterns (PR #38) rather than inventing new components.

## Implementation Plan

### Phase 1: Orders tile and select check

- 1.1 Orders tile `+` on the student dashboard.
- 1.2 Round 24px `ListCheck`, no selected-row fill in select sheets, `ContextSheet` uses it.

### Phase 2: Student events

- 2.1 `StudentEventDetailsScreen` + `/user/events/[eventId]` route, calendar opens it.
- 2.2 `/user/events` list on the new components, rows open the details.

## Risks

- `ListCheck` is shared: every select sheet changes look at once (intended).
- Notifications route `event_assigned` to `/user/events` — kept valid (list moves to `app/user/events/index.tsx`).

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Orders tile and select check

- [x] 1.1 Orders tile `+` on the student dashboard — 0e508df
- [x] 1.2 Round 24px select check — 0e508df

### Phase 2: Student events

- [ ] 2.1 Student event details screen
- [ ] 2.2 Student events list on the new components
