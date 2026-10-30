---
layout: page
feature: events
title: Events
group: organization
accent: events
icon: calendar
order: 21
summary: "Camps, seminars, exams and tournaments of the organization: the instructor creates an event for the organization, one school or chosen students, follows who is coming and who paid, marks exam takers and orders exam fees and belts for them. Students answer Attending or Absent."
purpose: "One list of participants per event instead of chat threads: who is coming, who paid, who takes the exam."
who:
  - role: "Instructor (organization owner)"
    outcome: "Creates, edits, cancels and deletes events, manages participants, exam takers and their orders, keeps the list of event types"
  - role: "Student"
    outcome: "Is notified when added, answers Attending or Absent until the event ends or is marked Paid"
rules:
  - "An event has a name, a **type** (Camp, Seminar, Exam… kept by the organization), optional short note and location, start and end day, price and currency, and *Exams planned*."
  - "**Who is it for?** The whole organization, one school, or selected members. Matching active students and students without an account become **participants**, all starting *Absent*."
  - "Editing an event adds students who now match; it never removes participants."
  - "Participant status: **Absent → Attending → Paid**. The instructor sets any status and saves with *Save*; the student answers Attending / Absent at once, unless the instructor marked them *Paid* or the event is cancelled or over."
  - "With *Exams planned*, each participant has a **Takes exam** switch, stored immediately. Only exam takers can get an **order for the event** (e.g. exam fee, belt), drafted on the participants screen and stored with *Save*."
  - "An event with **paid participants cannot be deleted**: it can only be **cancelled**. A cancelled event stays in the calendar and can be restored."
  - "An event type used by events cannot be deleted; the sheet says how many events use it."
messages:
  - situation: "Cancel an event"
    title: "Cancel Winter Camp?"
    message: "Participants will be notified. The event stays in the calendar as cancelled."
  - situation: "Delete an event with paid participants"
    title: "Delete is blocked"
    message: "This event has 6 paid participants and cannot be deleted. Cancel it instead."
  - situation: "Delete an event"
    title: "Delete Winter Camp?"
    message: "The event and its participant list will be removed. This cannot be undone."
  - situation: "Student added to an event"
    title: "Added to an event"
    message: "You've been added to Winter Camp on 20 Dec"
flows:
  - id: create
    title: "New event"
    steps:
      - title: "New event"
        text: "Name, type, short note, location, start and end (the day count shows as a chip), price and currency, *Exams planned*, and *Who is it for?*."
        screen: EventCreate
      - title: "Type"
        text: "The type sheet picks one of the organization's event types; *Add new* creates one, the header icon opens the list of types to rename or delete them."
        screen: EventTypePicker
      - title: "Create"
        text: "The event and its participants (everyone who matches the audience, *Absent*) are written and synced."
        screen: EventDetails
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Students notified"
        text: "For every participant with an account added by someone else, the database writes *Added to an event* and sends it as a push."
        screen: NotificationsStudent
        api:
          - { id: send-push, x: 85, y: 36 }
    diagram: |
      sequenceDiagram
        actor I as Instructor
        participant A as App
        participant L as Local DB
        participant Sync as Edge Function sync
        participant DB as Supabase DB
        I->>A: Event, audience, Create
        A->>L: Event
        A->>L: Members of the audience
        A->>L: One participant each, Absent
        A-)Sync: Push event and participants
        Sync->>DB: Insert
        DB->>DB: Added to an event per student with an account
  - id: participants
    title: "Participants and exams"
    steps:
      - title: "Event details"
        text: "Name with the day count, note, type, dates, location, price and the participants summary; *Manage* opens the participants."
        screen: EventDetails
      - title: "Participants"
        text: "A tap on the round button cycles Absent → Attending → Paid; *Save* stores the changes in one batch."
        screen: EventParticipants
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Exam takers"
        text: "With exams planned, *Takes exam* is stored at once; exam takers get *Add order* with their event orders below."
        screen: EventParticipantsExams
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Event order"
        text: "The order is for the locked student and the event; *Create* returns it to the participants screen as a draft, *Save* there stores it (see [Orders](./orders))."
        screen: OrderCreateEvent
  - id: answer
    title: "Student answers"
    steps:
      - title: "Notification"
        text: "*Added to an event* with the name and the start; a tap opens the student's events, where the event is listed."
        screen: NotificationsStudent
      - title: "Attending"
        text: "The student's event details show the event and their own status; Attending / Absent is saved at once. When the student answers *Attending*, the owner gets a notification."
        screen: Student
        api:
          - { id: sync-push, x: 84, y: 9 }
  - id: cancel
    title: "Cancel or delete"
    steps:
      - title: "Cancel or delete"
        text: "*Cancel* asks for a confirmation; the trash deletes, unless someone has paid, then the sheet offers the cancel instead. A cancelled event shows *Restore* in place of *Cancel*."
        screen: EventCancelSheet
        api:
          - { id: sync-push, x: 84, y: 9 }
---

<FeatureView>

## Code

| What | Where |
| --- | --- |
| Event list and calendar entry | `src/modules/events/components/EventListView.tsx`, `hooks/useEventList.ts`, [Calendar](./calendar) |
| New / edit event (routes `/organization/events/create`, `…/{eventId}/edit`) | `EventFormScreen.tsx`, `eventFormState.ts`, `hooks/useCreateEvent.ts`, `hooks/useUpdateEvent.ts` |
| Event details (route `/organization/events/{eventId}`) | `EventDetailsScreen.tsx`, `EventCancelSheet.tsx`, `cancelEvent`, `deleteEvent` in `services/eventService.ts` |
| Participants (route `…/{eventId}/participants`) | `EventParticipantsScreen.tsx`, `participantDrafts.ts`, `bulkSaveParticipantStatuses`, `setParticipantTakesExam`, `commitEventOrderChanges` |
| Event types (route `/organization/events/types`) | `EventTypesListScreen.tsx`, `EventTypeSheet.tsx`, `EventTypePickerSheet.tsx`, `services/eventTypeService.ts` |
| Student's events (routes `/user/events`, `/user/events/{eventId}`) | `StudentEventsScreen.tsx`, `StudentEventDetailsScreen.tsx`, `studentEvents.ts` |
| Notifications | `notify_event_participant` in `supabase/migrations/20261001000000_notifications.sql` |

## Data

| Table | Columns |
| --- | --- |
| `event_types` | `organization_id`, `name` |
| `events` | `organization_id`, `school_id`, `name`, `type_id`, `short_note`, `address`, `start_date`, `end_date`, `price`, `currency`, `visibility` (`organization` / `school` / `whitelist`), `status` (`active` / `cancelled`), `exams_planned` |
| `event_participants` | `event_id`, `school_member_id`, `status` (`absent` / `attending` / `paid`), `status_changed_by`, `takes_exam` |

`status_changed_by` tells the database who acted: the student themself (the RSVP notifies the owner) or someone else (adding notifies the student).

## Notes

- The cancel sheet says *Participants will be notified*, but there is no notification for a cancelled event; the participants only see it as cancelled.

</FeatureView>
