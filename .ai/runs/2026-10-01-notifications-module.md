# Execution plan — notifications module

Source doc: .ai/specs/2026-10-01-notifications-module.md
Refs: #9 (spec PR, merged, design-only)
Engine: om-auto-create-pr (steps: 13, --loop: no)

## Goal

Ship the notifications module from the spec: server-generated notifications for N1–N5, synced into WatermelonDB, shown in an in-app inbox with an unread badge, and delivered as Expo push notifications.

## Scope

- **Server:** one migration with `notifications` + `push_tokens`, RLS, the `notify()` helper, N1–N5 triggers, the `register_push_token` / `disable_push_token` RPCs and the `notifications` → `send-push` webhook trigger. A new `send-push` Edge Function. Sync pull/push of `notifications` in both sync modes.
- **Client:** WatermelonDB schema v19 + migration, `Notification` model, new `src/modules/notifications/` module (repository, services, hooks, components), a bell on both dashboards, the inbox screen `app/notifications/index.tsx`, a push toggle in Settings, a permission rationale sheet, a notification-tap handler, translations, and `expo-notifications`.
- **Docs:** extend the allowed direct Supabase calls in `CLAUDE.md`.

## Non-goals

- Extensions E1–E7, per-type preferences, a server-side purge job, and school-wide announcements (all out of scope per the spec).
- Changes to existing services. Generation is server-side only.
- EAS/FCM/APNs credential provisioning. This is an operational step that the PR documents.

## Deviations from the spec (verified against `main`)

- `public.school_join_requests` has **no `status` column on the server** (only the client model has one, at schema v18). N2 therefore fires on INSERT of a live row (`deleted_at is null`). When a `status` value is present it must be `pending`, read through `to_jsonb(new)` so the trigger works either way.
- Translation keys are **flat camelCase with a `notification` prefix** (e.g. `notificationOrderCreatedTitle`), not `notifications.*`, because every key in `en.json`/`pl.json` is flat.
- The bell is placed through a new optional `leftContent` prop on the core `Header`, which keeps `core` free of imports from `notifications`. The dashboards inject it.
- The repo has **no JS test runner**. Pure logic (deep-link map, payload/text formatting, push coalescing/templates) lives in dependency-free modules tested with Node's built-in `node --test` (TypeScript type stripping, Node ≥ 22). SQL behaviour is tested by a script against a disposable Postgres container (with a stub `auth` schema). `send-push` is tested with `deno test` in Docker.
- The Database Webhook ships as a migration trigger. It calls `net.http_post` with the function URL and a shared secret read from Supabase **Vault** (`send_push_url`, `send_push_secret`). It is a no-op when `pg_net` or the secrets are missing, and the setup is documented.

## Risks

- **New server contract:** ship the client (schema v19) before deploying the sync change. Older clients would get an unknown `notifications` table key. WatermelonDB ignores unknown tables in pull changes only with `unsafeTurbo` off — to be verified, else gate on client schema version (see Step 3).
- **Native dependency:** `expo-notifications` needs a new dev/EAS build. Push cannot be verified in this environment (no device, no credentials).
- **Triggers on four hot tables:** each is wrapped in `exception when others` so a notification failure never rolls back the source write.

## Implementation Plan

### Phase 1 — Server generation + sync + local storage

1. Migration: `notifications` table, indexes, unique idempotency index, RLS (select/update own; no insert/delete), `read_at`-only update guard.
2. Same migration: `notify()` helper + N1–N5 trigger functions/triggers (recipient resolution, never-notify-actor, exception-safe, N3 re-fire refreshes `updated_at` + clears `read_at`). SQL test script on disposable Postgres.
3. Sync: `sync-notifications.ts` (pull by `recipient_id`, 90-day first-pull window, `read_at`-only pushed updates for owned rows), wired into `sync-organization.ts` and `sync-user.ts`.
4. WatermelonDB: `notifications` table schema (v19) + migration, `Notification` model, `NotificationRepository` (`observeByRecipient`, `observeUnreadCount`, `markRead`, `markAllRead`).

### Phase 2 — In-app inbox

5. Module scaffold + types (`NotificationType`, payload DTOs, deep-link map) + `notificationService.markRead/markAllRead` with `sync().catch(console.error)`; node tests for pure helpers.
6. `NotificationBell` (unread badge) in both dashboard headers via `Header.leftContent`.
7. Inbox screen `app/notifications/index.tsx`: `BaseCard` rows, empty state, mark-all-read, deep-link navigation.
8. Translations in `en.json` + `pl.json` (duplicate check first).

### Phase 3 — Push delivery

9. `expo-notifications` + app config (plugin, Android channel), `push_tokens` table + `register_push_token`/`disable_push_token` RPCs, `pushRegistrationService`, `CLAUDE.md` allowed-calls update.
10. `send-push` Edge Function (tokens, localized templates, coalescing, Expo API, `DeviceNotRegistered` soft-delete) + `deno test` with mocked fetch.
11. Webhook trigger on `notifications` INSERT → `send-push` (Vault-configured) + setup docs.
12. Settings "Push notifications" toggle, first-dashboard permission rationale sheet, `disable_push_token` on logout.
13. Notification-tap handler (listener + cold start) routing through the shared deep-link map and marking read.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Server generation + sync + local storage

- [ ] 1.1 notifications table, indexes, idempotency index and RLS migration
- [ ] 1.2 notify() helper and N1–N5 triggers with SQL tests
- [ ] 1.3 Sync pull/push of notifications in both sync modes
- [ ] 1.4 WatermelonDB schema v19, Notification model and NotificationRepository

### Phase 2: In-app inbox

- [ ] 2.1 Notifications module scaffold, types, deep-link map and notificationService
- [ ] 2.2 NotificationBell unread badge in both dashboard headers
- [ ] 2.3 Inbox screen with mark-read, mark-all-read and deep links
- [ ] 2.4 Notification translations in en.json and pl.json

### Phase 3: Push delivery

- [ ] 3.1 expo-notifications, push_tokens + RPCs, pushRegistrationService, CLAUDE.md rule update
- [ ] 3.2 send-push Edge Function with tests
- [ ] 3.3 Database webhook trigger on notifications insert
- [ ] 3.4 Settings push toggle, permission rationale sheet, disable token on logout
- [ ] 3.5 Notification-tap handler routing and mark-read
