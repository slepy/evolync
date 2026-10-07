# Notification tap opens the recipient's own context

## Goal

Tapping a notification (push or inbox row) opens the screens of the role the notification is addressed to — student notifications in the student context of the right school, owner notifications in the organization context — and a cold-start push tap no longer races the session restore.

## Investigation

- Routes are already per type: `payment_created` / `event_assigned` → `/user/*` (student), `order_created` / `join_request_created` / `event_rsvp_attending` → `/school/*`, `/organization/*` (owner). The student was not sent to an owner screen.
- Cold start race (likely crash/kick-out): `NotificationResponseHandler` navigates as soon as `user` is set. `checkSession()` sets the user *before* loading the organization and memberships and then calls `router.replace('/')`, and the index screen replaces again with a dashboard. The push therefore pushes `/user/payments` over the login launch screen (memberships not loaded yet), and moments later `replace('/')` swaps the payments screen out from under the user and remounts index → dashboard.
- Context is ignored: the target opens on top of whatever stack is current. An owner who also trains as a student gets the student payments screen over the organization dashboard (Back → owner view), and the active membership is not switched to the school the notification is about, so `/user/payments` may show another school's payments.

## Scope

- `src/modules/notifications` — audience per type, pure context plan, shared open hook, push handler gating, inbox uses the same opener.
- `src/core/components/BottomNav` — export `NAV_HOME_HREF` / `useNavStore` for the opener.

### Non-goals

- No change to server-side recipients, push payloads or routes per type.
- No redesign of the auth bootstrap (`checkSession`) or of the index redirect.

## Implementation Plan

### Phase 1: Context plan

- 1.1 Pure `getNotificationAudience` + `planNotificationContext` (owner needs an organization; student needs the membership of the notification's school) with unit tests.

### Phase 2: Opening

- 2.1 `useOpenNotification` hook: switch membership (persisted) and dashboard (reset stack to the recipient's dashboard) when needed, then push the target; push handler waits until launch routes (`/`, `/auth/*`) are left; inbox uses the same hook.

## Risks

- Several router calls in one tick (dismissAll → replace → push); expo-router 6 / React Navigation 7 apply them sequentially. Not verifiable on a device from this run — needs a manual push test on Android.

## Progress

PR: #40

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Context plan

- [x] 1.1 Audience and context plan per notification type — c7c7093

### Phase 2: Opening

- [x] 2.1 Shared opener for push taps and inbox rows, gated on launch — 0c64e7e
