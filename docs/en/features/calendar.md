---
layout: page
feature: calendar
title: Calendar
group: organization
accent: organization
icon: calendar
order: 23
summary: "One month grid with the events and trainings of the current context: the whole organization, one school, or the student. Multi-day events are drawn as bars, the selected day lists its items, and the instructor adds an event or a training on that day."
purpose: "Answers when and what in one place, without opening Events and Trainings separately."
who:
  - role: "Instructor (organization owner)"
    outcome: "Sees the organization's or one school's schedule and adds events and trainings on a day"
  - role: "Student"
    outcome: "Sees their events and their school's trainings, read-only, and opens an event to answer"
rules:
  - "The calendar opens from the dashboard hero (*Next up*) of the current context."
  - "**Organization**: events and trainings of every school; *Add new* offers an event or a training. A *List* view filters the organization's events by date range and type."
  - "**School**: the trainings that concern this school only; *Add new* opens a training for this school."
  - "**Student**: the events they take part in and the trainings of their school (or meant for them); no *Add new*; only events open."
  - "Filter chips *All*, *Events*, *Trainings*. The grid starts on Monday; at most two multi-day events get a bar, the others show as dots."
  - "The day picked becomes the start day of the new event or training."
  - "Days are stored as UTC midnight and formatted in UTC, so the device time zone never moves an item to another day."
messages:
  - situation: "Add new on a day"
    title: "Add new"
    message: "The selected day is filled in as the start date."
flows:
  - id: browse
    title: "Month and day"
    steps:
      - title: "Organization calendar"
        text: "Month grid with event bars and dots for events and trainings; the selected day lists its events first, then trainings by start time. A row opens the event or the training."
        screen: Calendar
      - title: "Add new"
        text: "*Add new* on the selected day: *Event* (one or more days) or *Training* (one-off or recurring)."
        screen: CalendarAddSheet
      - title: "School calendar"
        text: "Opened from a school dashboard, with the school's color and only the trainings that concern the school."
        screen: CalendarSchool
---

<FeatureView>

## Code

| What | Where |
| --- | --- |
| Routes | `app/organization/calendar.tsx`, `app/school/[schoolId]/calendar.tsx`, `app/user/calendar.tsx` |
| Connected calendar (loads events and trainings of the scope) | `src/core/components/Calendar/Calendar.tsx` |
| Presentational month view and the add sheet | `CalendarView.tsx`, `CalendarAddSheet.tsx`, `DayCell.tsx`, `FilterChips.tsx` |
| Month grid, bars, items of a day (pure logic) | `calendarMonth.ts`, `calendarFormat.ts` |
| Organization event list (List view) | `src/modules/events/components/EventListView.tsx` |

The calendar reads only the local database, through the events and trainings repositories, so it works offline. See [Events](./events) and [Trainings](./trainings).

## Notes

- The school board shows events in the school calendar; the app shows trainings only there.

</FeatureView>
