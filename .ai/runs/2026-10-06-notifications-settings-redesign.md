# Notifications (N1–N5) and Settings (17A / 17B) — rebuilt on the canvas boards

Engine: om-auto-create-pr (steps: 7, --loop: no)

## Goal

Rebuild the notifications inbox (owner / student), its empty and "no longer available" states, the push prompt sheet, and the Settings tab (account settings in the bottom nav, every role) on the canvas boards, using the shared `src/core/components` and design tokens.

## Brief (operator, translated)

> Based on the design "Notifications — inbox (owner / student), empty, push prompt", rebuild the notification screens; and "Settings — account settings, a tab in the bottom nav (every role)".

## Design source

Local copies of the canvas boards (`NotificationsOrg / Student / Empty / Unavailable / PushPrompt / Settings / SettingsBlocked.dc.html`, newest copy, 2026-10-06):

- N1 `NotificationsOrg` — title "Notifications" 28/800, Synced pill, 44px round "Mark all as read" button (check-check); page glow in the Home context (organization amber); groups TODAY / YESTERDAY / EARLIER (uppercase 12/800 label), "N new" red chip on a group with unread items; one card per group; row: 48px module-tinted icon (order = orders violet shopping bag, join request = students orange user-plus, attendee = events amber calendar-check), title 16 (unread 800 white + red 8px dot, read 700 `#CBD5E1`), time on the right (today "12 min" / "3 h", yesterday "18:40", earlier "12 Nov"), body 13.5/500 muted, wraps; unread row gets a 3% white fill.
- N2 `NotificationsStudent` — same, student blue glow; payment = payments green credit card ("150,00 zł for 1–30 Nov"), added to an event = events amber calendar-plus ("You've been added to Winter Camp on 20 Dec").
- N3 `NotificationsUnavailable` — amber notice on top: info icon + "This item is no longer available.".
- N4 `NotificationsEmpty` — no Mark-all button; 72px neutral bell-off square, "No notifications yet" 22/800, "New orders, join requests and event sign-ups show up here, also when you're offline.".
- N5 `NotificationsPushPrompt` — sheet on the dashboard: 48px neutral bell-ring square, "Stay in the loop" / "Alerts on this device, even when the app is closed."; card with rows (owner: "New orders from students", "Requests to join your schools", "Who signs up for your events"); white "Turn on" + outlined "Not now".
- 17A `NotificationsSettings` — "Settings" + Synced pill, no glow; cards with a 40px neutral icon, 18/800 title and muted subtitle: Notifications ("This device only": Push notifications switch + hint), Language ("Changes the app right away": English / Polski radio rows), Appearance ("Stored on this device": System "Follows your phone" / Light / Dark). The newest board no longer has "Join another school".
- 17B `NotificationsSettingsBlocked` — push hint in red "Notifications are blocked in your device settings.", disabled switch, "Open device settings" pill.

## Scope

- Shared (`src/core/components`): `TabPage` layout (title + Synced pill + optional actions, optional context glow, bottom nav) for nav-tab screens; `IconButton` (44px round neutral); `Notice` (amber status banner); `EmptyState` (icon square, title, text); `SettingsCard` (icon + title + subtitle card); `Toggle` (52×32 switch); `ChoiceList` gets a `"light"` accent (white selection of 17A) and a `surface` for rows inside a card.
- `src/modules/notifications`: pure grouping / time label logic with tests; `NotificationRow` replaces `NotificationCard`; `NotificationsScreen` rebuilt (N1–N4); `PushPermissionPrompt` rebuilt (N5, owner / student rows); `PushNotificationsSetting` rebuilt for 17A / 17B; in-app body copy matches the boards.
- Settings route `app/user/settings.tsx` rebuilt (17A / 17B) with Language and Appearance cards.

## Non-goals

- Data model, repositories, services, push registration, sync, Supabase / edge functions.
- Student join-school flow (still reachable from the student dashboard and registration).
- Profile tab, dashboards (except where they mount the push prompt).

## Implementation Plan

### Phase 1: Shared components and pure logic

- 1.1 Shared: `TabPage`, `IconButton`, `Notice`, `EmptyState`, `SettingsCard`, `Toggle`, `ChoiceList` light accent.
- 1.2 Notifications grouping + time labels (`inboxGroups.ts`) with tests; row style map.

### Phase 2: Screens

- 2.1 N1–N4 inbox: `NotificationRow`, `NotificationsScreen`, board copy.
- 2.2 N5 push prompt sheet.
- 2.3 17A / 17B Settings tab: push card, language, appearance.

### Phase 3: Cleanup and gate

- 3.1 Remove unused UI / translation keys; en + pl complete; CLAUDE.md shared-components line.
- 3.2 Full validation gate.

## Notes

- After merging main (#31, which added `FormCard` for 15A), the planned `SettingsCard` was folded into `FormCard` (`accent="neutral"`, new `gap` prop) instead of shipping a duplicate.

## Risks

- Copy for the student push prompt rows and the student empty-state text is not on a board; derived from N2 (payments, added to an event).
- In-app body copy changes ("Michał Kaczmarek · 3 items"); push payloads rendered server-side are untouched.

## Progress

PR: #32

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Shared components and pure logic

- [x] 1.1 Shared: TabPage, IconButton, Notice, EmptyState, SettingsCard, Toggle, ChoiceList light accent — fb1a5ca
- [x] 1.2 Notifications grouping + time labels with tests; row style map — 448e9ca

### Phase 2: Screens

- [x] 2.1 N1–N4 inbox — 0e0458b
- [x] 2.2 N5 push prompt sheet — 1644055
- [x] 2.3 17A / 17B Settings tab — 56b8de6

### Phase 3: Cleanup and gate

- [x] 3.1 Remove unused UI and translation keys; CLAUDE.md — 1178f02
- [x] 3.2 Full validation gate — 1178f02 (typecheck, check:theme, npm test 276/276)
