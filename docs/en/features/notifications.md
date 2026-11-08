---
layout: page
feature: notifications
title: Notifications
group: account
accent: brand
icon: bell
order: 5
summary: "An inbox on the Alerts tab and push messages on the device: owners hear about new orders, join requests and event sign-ups; students about new payments, being added to an event and an approved join request. A tap opens the place it is about."
purpose: "Tells people what changed without them having to open every screen, also when the app is closed."
who:
  - role: "Instructor (organization owner)"
    outcome: "Gets new orders, join requests and students attending events"
  - role: "Student"
    outcome: "Gets new payments, being added to an event, and the approval of a join request"
rules:
  - "Notifications are written **by the database** (triggers), never by the app, so they reach the recipient whichever device acted."
  - "Nobody is notified about their own action (an owner ordering for themselves, a student added by themselves)."
  - "The inbox is synced like other data and works offline; rows are grouped *Today*, *Yesterday*, *Earlier* with the count of new ones; *Mark all as read* marks them locally and syncs."
  - "A row is deleted with the **trash button** next to it, after *Delete this notification?*; the header trash (*Delete all*) asks *Delete all notifications?*. Deletion is a soft delete that syncs, so the notification also disappears on the person's other devices; the server accepts it only on the caller's own live rows."
  - "A tap marks the notification read and opens: the order, the school's requests, the event, the student's payments, the student's events or the student dashboard. When the item no longer exists, the inbox shows *This item is no longer available.*"
  - "**Push** is per device: the first dashboard visit explains it in a sheet before the system prompt; Settings has a switch that follows both the user's choice and the system permission."
  - "Push messages are sent in the device's language. More than 3 notifications for one person within 60 seconds collapse into one push."
  - "A device token is device state: it goes straight to Supabase through `register_push_token` / `disable_push_token`, and is registered again when it is stale or the language changed."
messages:
  - situation: "Empty inbox"
    title: "No notifications yet"
    message: "New orders, join requests and event sign-ups show up here, also when you’re offline."
  - situation: "The item was deleted"
    message: "This item is no longer available."
  - situation: "Push explained"
    title: "Stay in the loop"
    message: "Alerts on this device, even when the app is closed."
  - situation: "Push blocked by the system"
    message: "Notifications are blocked in your device settings."
flows:
  - id: inbox
    title: "Inbox"
    steps:
      - title: "Alerts"
        text: "Rows tinted by module with the unread dot and the time; *Mark all as read* and the trash (*Delete all*) in the header; each row has its own trash button."
        screen: NotificationsOrg
        api:
          - { id: sync-pull, x: 50, y: 4 }
      - title: "Student"
        text: "A student's inbox: new payments and events they were added to."
        screen: NotificationsStudent
      - title: "No longer available"
        text: "A notification about something deleted opens the inbox again with an amber notice."
        screen: NotificationsUnavailable
      - title: "Empty"
        text: "Before the first notification."
        screen: NotificationsEmpty
    diagram: |
      sequenceDiagram
        participant DB as Supabase DB
        participant P as Edge Function send-push
        participant E as Expo push
        actor U as Recipient
        participant A as App
        DB->>DB: Trigger writes notifications row
        DB-)P: pg_net call with the row
        P->>P: Recipient's enabled tokens, language
        P->>E: Push (or one summary when more than 3 in 60 s)
        E-->>U: Banner
        U->>A: Tap
        A->>A: Mark read, open the target
        A-)DB: Sync the read mark
  - id: push
    title: "Push on this device"
    steps:
      - title: "First time"
        text: "On the first dashboard visit a sheet lists what push brings for this role; *Turn on* asks the system, *Not now* leaves it off."
        screen: NotificationsPushPrompt
        api:
          - { id: register-push-token, x: 50, y: 85 }
      - title: "Settings"
        text: "*Push notifications* switch for this device."
        screen: NotificationsSettings
        api:
          - { id: disable-push-token, x: 80, y: 13 }
      - title: "Blocked"
        text: "When the system blocks notifications, the hint turns red and *Open device settings* appears; the screen checks again when the app comes back."
        screen: NotificationsSettingsBlocked
      - title: "Delivery"
        text: "The database calls `send-push` for every new notification."
        screen: NotificationsOrg
        api:
          - { id: send-push, x: 50, y: 20 }
---

<FeatureView>

## Code

| What | Where |
| --- | --- |
| Alerts tab (route `/notifications`) | `app/notifications/index.tsx`, `src/modules/notifications/components/NotificationsScreen.tsx`, `NotificationRow.tsx`, `utils/inbox.ts` |
| Texts of each type | `utils/content.ts` |
| Where a tap leads | `utils/routes.ts`, `utils/target.ts`, `services/notificationNavigation.ts` |
| Push tap handler | `NotificationResponseHandler.tsx` |
| Push prompt and setting | `PushPermissionPrompt.tsx`, `PushNotificationsSetting.tsx`, `services/pushRegistrationService.ts` |
| Triggers | `supabase/migrations/20261001000000_notifications.sql` and later `notify_*` migrations |
| Sending | `supabase/functions/send-push/` |

## Types

| Type | Recipient | Opens |
| --- | --- | --- |
| `order_created` | school owner | the order |
| `join_request_created` | school owner | Students → Requests |
| `event_rsvp_attending` | organization owner | the event |
| `payment_created` | student | Payments |
| `event_assigned` | student | the student's events |
| `join_request_approved` | student | the student dashboard |

</FeatureView>
