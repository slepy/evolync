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
- The sync runs with the service role, so pushed `event_types` rows are limited to the owner's organization
  (create never overwrites an existing id, update / delete are scoped by `organization_id`).
- Added the 13 missing `eventValidation*` translations (the event form showed raw keys); the events
  translation test now scans services and validation too.
- "School and student calendars render without the switch" is covered by code (they pass no `listView`)
  and UI QA; the repo has no component render tests for Tamagui screens.

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

## Review round (om-auto-review-pr)

- Fixed: member type pull scoped to the event's organization; full pull of tables with migrated columns (`events.type_id`); v22 migration test; Supabase migration applied twice on a throwaway Postgres — 636069d, 91c4f22.

## Risks

- Schema change (new table + nullable column): additive; older builds ignore `type_id`.
- The Supabase migration was verified on a throwaway Postgres with stubbed Supabase prerequisites, not on a real Supabase stack; it must be pushed with the deploy.
- The sync edge function must be redeployed together with the migration.

## Progress

PR: #48

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Event types

- [x] 1.1 Supabase migration `event_types` + `events.type_id` + RLS — 83e0574
- [x] 1.2 WatermelonDB model, schema, migration v22 — 1d906f9
- [x] 1.3 Sync push/pull of `event_types` — d6b98eb
- [x] 1.4 Repository, service, schema, hooks — 69854a8
- [x] 1.5 Type sheets, types list screen, translations — 44b5fa1
- [x] 1.6 Event form TYPE field — 15cea95
- [x] 1.7 Type in event details and calendar rows — 1c68138

### Phase 2: Filtered list view

- [x] 2.1 `filterEventList` helper — 0c2f02a
- [x] 2.2 `useEventList` hook — 69e3c0b
- [x] 2.3 `EventListView` — f8b2927
- [x] 2.4 `Calendar` `listView` slot on the organization calendar — e02634d
