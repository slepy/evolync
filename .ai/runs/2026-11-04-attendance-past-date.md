# Execution plan — Attendance for today or a past date

## Goal

An instructor creating an attendance session picks the day: Today or a past date (no future days), as on boards 13C / 13C1 (`design/project/AttendanceCreate.dc.html`, `AttendanceCreatePastDate.dc.html`).

## Brief (user, 2026-11-04)

"zbuduj funkcjonalnosc z designow wyboru daty obecnosci" — build the attendance date choice from the designs.

## Scope

- `AttendanceCreateScreen` (13C): header "New session"; DAY `PillGroup` (Today / Past date, attendance accent); Today shows the date under the pills; Past date shows a DATE `DateTimeField` (max = today) with the hint "Today or an earlier day. Future days cannot be picked."
- The session is stored on the picked day: both Today and a past day are stored at UTC midnight of the picked local day — the value sync keeps (`supabase/functions/sync/utils.ts:42` writes the UTC day) and returns on pull.
- One session per day stays the rule: when the picked day already has a session, the button reads "Open" and opens that session instead of creating a second one.
- The Add button on 13A and the dashboard `+` always open the create screen (before, Add opened today's session when it existed, so a past day could never be added).
- `AttendanceSessionBody` takes optional content above the status summary.
- Translations en / pl / hu.

## Non-goals

- Changing the session details screen (13B) or the sessions list layout.
- Server-side uniqueness of one session per day.
- Editing the date of an existing session.

## Decisions

- Base branch: the config names `auto`, which does not exist on the remote; the PR targets `main` (repository default).
- Past day default: yesterday (the most common late entry).
- Existing session on the picked day → "Open" (one-word label, design rule), not an error.

## Implementation Plan

### Phase 1: Date logic

1.1 Pure helpers in `sessionList.ts`: `sessionDateForDay`, `findSessionOnDay`, `formatSessionDate`; unit tests.

### Phase 2: Screen

2.1 `AttendanceSessionBody` slot above the summary; `AttendanceCreateScreen` with DAY / DATE, existing-session "Open"; routes and Add flow; translations.

### Phase 3: Validation

3.1 Full validation gate (`npm run typecheck`, `npm run check:theme`) and the attendance tests.

## Risks

- Timezones: sessions are stored at UTC midnight of the picked day, like every session pulled from the server. West of UTC that shows as the previous local day — the same as already-synced sessions (out of scope).
- Behavior change: Add on 13A no longer jumps straight into today's session; the create screen offers "Open" for it instead.

## Progress

PR: #72

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Date logic

- [x] 1.1 Pure date helpers with unit tests — 7b3b35c

### Phase 2: Screen

- [x] 2.1 Create screen with DAY / DATE, existing session, routes, translations — 95e9c8a

### Phase 3: Validation

- [x] 3.1 Full validation gate — 95e9c8a
