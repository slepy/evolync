# Event list — tap a participant to manage participants

## Problem

In the organization calendar's List view an event row's chevron expands its
participants (avatar, name, read-only status). The participants render as
`ListRow` children, outside the row's pressable, so a tap on a participant does
nothing. Statuses change only on the Participants screen, reached through the
event details → Manage.

## Behavior

- A tap on any participant row of an expanded event opens
  `/organization/events/[eventId]/participants` for that event — the screen
  Manage on the details opens.
- A tap on the event row itself still opens the event details; the chevron
  still only expands / collapses.
- The empty ("No participants") and loading states are not pressable.
- Each participant row is a button for screen readers: label = member name,
  hint = "Manage participants" (`eventsManageParticipants`, en / pl / hu).

## Acceptance criteria

1. Expanded event, tap participant → Participants screen of that event.
2. Tap on the event row (not on a participant) → event details, unchanged.
3. Participant rows have `role="button"`, the member name as label, the hint.
4. No participants → the empty text, nothing pressable.

## Design

- `EventRowParticipantsView` (new, presentational): `participants`,
  `isLoading`, `onParticipantPress`. `EventRowParticipants` stays the connected
  wrapper (`useEventParticipants`) and gains `onManageParticipants`.
- `EventListView` gains a required `onManageParticipants(eventId)` prop; the
  route `app/organization/calendar.tsx` pushes the participants route.
- No data, schema, sync, or permission change: the route already requires the
  organization owner (`useRequireOrganizationOwner`).

## Tests

- `src/modules/events/__tests__/eventRowParticipantsView.test.ts`: renders the
  view with stubbed host components, asserts a press on each participant calls
  the handler, rows are buttons with name + hint, the empty state has no press.
- Validation gate: `npm run typecheck`, `npm run check:theme`, `npm test`.

## Rollout

Single UI change, no migration; rollback = revert.

## Phases

1. Presentational view + connected wrapper + list / route wiring + translations.
2. Test + gate.
