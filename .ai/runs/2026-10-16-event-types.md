# Execution plan — event types and filtered event list

Source doc: .ai/specs/2026-10-16-event-types.md
Spec PR: #47 (merged, design-only)

## Goal

Every event gets an organization-defined type (Seminar, Camp, …) picked in the event form,
and the organization calendar gains a List view filtered by a date range and a type.

## Scope

- Supabase: `event_types` table + nullable `events.type_id` + RLS (org owner manages, org-school members select).
- WatermelonDB: `EventType` model, `event_types` table, `events.type_id`, schema v22 + migration.
- Sync edge function: push/pull `event_types` for the organization owner; members pull the types their events reference.
- events module: `EventTypeRepository`, `eventTypeService`, `eventTypeSchema`, `useEventTypes` / `useEventType`,
  `EventTypeSheet` (7B / 7C copy), `EventTypePickerSheet` (T5 copy, single choice), `EventTypesListScreen`
  at `/organization/events/types`, TYPE field in the event form, type in event details.
- core `Calendar`: type in the event row meta; optional `listView` slot rendered behind a Month / List `ViewSwitch`.
- `filterEventList`, `useEventList`, `EventListView` on the organization calendar.
- Translations en + pl.

## Non-goals

- No type colors (A6), no multiple types per event (A5).
- No list view on school / student calendars (A8); trainings are not listed (A7).
- No backfill of existing events (column nullable, type required on next save, A3).

## Decisions taken during implementation

- `Calendar.listView` is a render prop `(range: { from, to }) => ReactNode` instead of a plain node, so the
  list's default FROM–TO comes from the month shown in Month view (spec UI/UX section) without core importing modules.
- Soft-deleted types are pulled as updates carrying `deleted_at` (not as deletes), so an event that still
  points at one resolves its name (spec edge case "type deleted on another device").

## Implementation Plan

### Phase 1: Event types
- 1.1 Supabase migration `event_types` + `events.type_id` + RLS.
- 1.2 WatermelonDB `EventType` model, schema, `events.type_id`, migration v22, model registered.
- 1.3 Sync: push/pull `event_types` for organizations; referenced types for members (+ Deno tests).
- 1.4 `EventTypeRepository`, `eventTypeService`, `eventTypeSchema`, hooks (+ unit tests).
- 1.5 `EventTypeSheet`, `EventTypePickerSheet`, `EventTypesListScreen` route, translations.
- 1.6 Event form TYPE field, `typeId` in form state / validation / DTOs / create + update (+ tests).
- 1.7 Type in event details and calendar row meta (+ tests).

### Phase 2: Filtered list view
- 2.1 `filterEventList` pure helper (+ tests).
- 2.2 `useEventList` hook.
- 2.3 `EventListView` (filters card, result list, empty state).
- 2.4 `Calendar` `listView` slot with `ViewSwitch`; organization calendar passes `EventListView`.

## Risks

- Schema change (new table + nullable column): additive; older builds ignore `type_id`.
- The Supabase migration is not applied by this run (no local Supabase stack); it must be pushed with the deploy.
- The sync edge function must be redeployed together with the migration.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Event types

- [ ] 1.1 Supabase migration `event_types` + `events.type_id` + RLS
- [ ] 1.2 WatermelonDB model, schema, migration v22
- [ ] 1.3 Sync push/pull of `event_types`
- [ ] 1.4 Repository, service, schema, hooks
- [ ] 1.5 Type sheets, types list screen, translations
- [ ] 1.6 Event form TYPE field
- [ ] 1.7 Type in event details and calendar rows

### Phase 2: Filtered list view

- [ ] 2.1 `filterEventList` helper
- [ ] 2.2 `useEventList` hook
- [ ] 2.3 `EventListView`
- [ ] 2.4 `Calendar` `listView` slot on the organization calendar
