# Delete notifications (Alerts tab)

## Goal

Users (owners and students) can remove notifications they no longer need from
the Alerts tab, one at a time or all at once. Removal works offline and
follows the user to their other devices after sync.

## Acceptance criteria

1. Swiping a notification row to the left reveals a red Delete action; tapping
   it removes the row immediately, no confirmation (low-value, frequent
   action — same as mail / system inboxes; the swipe plus tap is already a
   deliberate two-step gesture).
2. Screen readers get a "Delete" accessibility action on every row.
3. When the inbox is not empty, the header shows a red trash button next to
   "Mark all as read". It asks for confirmation ("Delete all notifications?")
   and then removes every notification of the user.
4. Deleted notifications disappear from the list, the day-group "N new" chips
   and the unread badge on the Alerts tab, offline.
5. After sync the deletion is stored on the server (`deleted_at`), so other
   devices drop the row on their next pull and the first pull of a new device
   never returns it.
6. A later event on the same entity (e.g. another order update) creates a new
   notification — the server's unique index only covers live rows.

## Architecture

- Soft delete, as every other table: the client sets `deleted_at` on the local
  row (`NotificationRepository.softDelete` / `softDeleteAll`), never
  `markAsDeleted` / `destroyPermanently`, so the change is pushed as an
  `updated` record. Queries already filter `deleted_at = null`.
- Service `deleteNotification` / `deleteAllNotifications` call the repository
  and trigger `sync()` fire-and-forget.
- Server sync (`sync-notifications.ts` push): besides `read_at`, accept a
  positive `deleted_at` on the caller's own rows and only while the row is
  still live (`deleted_at is null`), so a server-side deletion timestamp is
  never overwritten and a row is never un-deleted. Every other column stays
  ignored; created / deleted id lists stay ignored.
- No database migration: the sync edge function writes with the service role
  and the update stays scoped by `recipient_id`. Direct client writes remain
  limited to `read_at` by the existing column grant.
- UI: new shared `SwipeToDelete` in `src/core/components/` (wraps a row in
  `ReanimatedSwipeable` from react-native-gesture-handler, red action from the
  `danger` tokens). `NotificationsScreen` wraps each `NotificationRow`; header
  actions get a `TrashButton`.

## Protected contracts

- Sync push contract for `notifications` widens from `read_at` to
  `read_at` + `deleted_at` (set only). Older clients never send `deleted_at`
  changes, so they are unaffected. The sync edge function must be deployed
  **before** the client release: a push the old server ignores still marks
  the local row synced, and a later server-side update of that row (e.g. an
  order item count refresh) would pull it back with `deleted_at = null` —
  the same limitation `read_at` already has with a failed push.
- The server stamps `deleted_at` with its own clock; the client value only
  signals the deletion.
- `SwipeToDelete` needs `GestureHandlerRootView`, added at the root layout
  (outermost, so portaled sheets are inside it as well).

## Failure behavior

- Sync failure: the deletion stays local and is pushed on the next sync.
- Server row already deleted by a trigger: the push update matches no row, no
  error.

## Tests

- Unit (`notificationRepository.test.ts`): `softDelete` hides a row from
  `observeByRecipient` and the unread count; `softDeleteAll` touches only the
  caller's live rows and returns the count.
- Deno (`sync-notifications.test.ts`): push applies `deleted_at` scoped to the
  caller and live rows; a record with `deleted_at: null` never clears it.

## Phases

1. Repository + service + unit tests.
2. Sync push + Deno tests.
3. UI: `SwipeToDelete`, screen wiring, translations (en / pl / hu).
