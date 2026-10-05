# Events — add / edit / manage from the calendar (10A–10E)

Engine: om-auto-create-pr (steps: 9, --loop: no)

## Goal

Rebuild the organization event screens from the canvas boards 10A–10E ("Events — add / edit / manage (opened from the calendar)") and make them behave like trainings (11A–11F): events are created only from the organization calendar, Create / Save / Delete return to the calendar, and there is no separate events list.

## Brief (operator, translated)

> Based on the design, build the add and edit event views ("Events — add / edit / manage (opened from the calendar)"). Events can be added only from the organization calendar; after adding and editing it should work like trainings. I should not see the events list as a separate list, only from the calendar.

## Design source

Canvas boards (local copies of the "Evolync Redesign Mockups" canvas, read from the earlier canvas session):

- **10A · New event** — NAME, SHORT NOTE (OPTIONAL), LOCATION (OPTIONAL), START / END (start taken from the day picked in the calendar, "N days" chip, "shown as a bar"), PRICE + CURRENCY, "Who can see it?" (Entire organization / Specific school / Selected members), Create (Events amber).
- **10B · Edit event** — same form, SELECT MEMBERS list for Selected members, Save shown active only after a change.
- **10C · Event details** — name + "N days" chip, short note, date range row, location row, Price row, Participants stat tiles (Absent / Attending / Paid) + Manage, Actions: Edit / Cancel, trash in the header.
- **10D · Participants** — event name, the three counters, hint "Tap a status to change it", member rows (avatar, name, email, status chip cycling Absent → Attending → Paid), Save after a change.
- **10E · Cancel / delete confirmation (sheet)** — "Cancel {name}?" with Cancel event / Keep; "Delete is blocked" note when the event has paid participants.

## Scope

- `src/modules/events/components`: new `EventFormScreen`, `EventDetailsScreen`, `EventParticipantsScreen`, `EventCancelSheet`, pure `eventFormState.ts` (+ tests).
- Shared "Who can see it?" / "Who is it for?" choice moved to `src/core/components/AudienceChoice` (accent + title props) and reused by trainings and events.
- Routes: `app/organization/events/create.tsx`, `[eventId]/index.tsx`, `[eventId]/edit.tsx`, `[eventId]/participants.tsx` rewritten thin; `app/organization/events/index.tsx` removed.
- Navigation like trainings: Create → back to the calendar; Edit save → dismiss edit + details back to the calendar; Delete → back to the calendar.
- Notification fallback route `/organization/events` → `/organization/calendar`.
- Old UI pieces no longer used (`EventForm`, `EventCard`, `EventParticipantRow`) and their now-unused translation keys removed.

## Non-goals

- Service / repository / schema / sync changes (event data layer stays as is).
- Student side (`/user/events`, student calendar) — out of the brief (it talks about the instructor adding/editing).
- School calendar adding events (brief: events are added only from the organization calendar; school calendar stays trainings-only).
- Recurring events.

## Implementation Plan

### Phase 1: Form state and shared audience choice

- 1.1 `eventFormState.ts`: initial form from the calendar day, form from an event, validation (name, dates, price, currency, audience), change detection, day count; unit tests.
- 1.2 Move `TrainingAudienceChoice` to `src/core/components/AudienceChoice` (accent / title props), trainings use it.

### Phase 2: Screens 10A–10E

- 2.1 `EventFormScreen` (10A / 10B) + create / edit routes, navigation back to the calendar.
- 2.2 `EventDetailsScreen` (10C) + `EventCancelSheet` (10E) + details route.
- 2.3 `EventParticipantsScreen` (10D) + participants route.

### Phase 3: Calendar-only entry and cleanup

- 3.1 Remove the `/organization/events` list route; notification fallback goes to the calendar; tests updated.
- 3.2 Remove unused old event UI (`EventForm`, `EventCard`, `EventParticipantRow`) and unused translation keys; add new keys (en + pl).
- 3.3 Update CLAUDE.md shared-components line (AudienceChoice) and run the full gate.

## Risks

- Canvas read from a local copy of the boards (the live canvas is not reachable from this session) — later canvas edits may differ.
- Moving the audience choice touches the trainings forms (regression risk, covered by typecheck and a visual re-check).
- Not checked on a device / simulator (needs a logged-in owner account).

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Form state and shared audience choice

- [ ] 1.1 Event form state with tests
- [ ] 1.2 Shared AudienceChoice component

### Phase 2: Screens 10A–10E

- [ ] 2.1 Event form screen and create / edit routes
- [ ] 2.2 Event details screen and cancel / delete sheet
- [ ] 2.3 Participants screen

### Phase 3: Calendar-only entry and cleanup

- [ ] 3.1 Remove the events list route
- [ ] 3.2 Remove unused event UI and translation keys
- [ ] 3.3 Docs and full validation gate
