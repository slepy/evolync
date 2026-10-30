---
layout: page
feature: attendance
title: Attendance
group: school
accent: attendance
icon: calendar-check
order: 13
summary: "One session per training day: the instructor opens today's session, everyone starts as present, and taps the ones who are absent or excused. Students see their own attendance."
purpose: "A quick register at the start of a class, also offline, and a history of who trains how often."
who:
  - role: "Instructor (organization owner)"
    outcome: "Takes attendance for today, corrects earlier sessions, deletes a session"
  - role: "Student"
    outcome: "Sees their own sessions and the share of sessions they attended, read-only"
rules:
  - "A school has **one session per day**. *Add new* opens today's session when it already exists."
  - "A new session lists every student who is active or has no account; **everyone starts Present**."
  - "A tap on the status button cycles **Present → Absent → Excused**. Nothing is stored until *Create* or *Save*."
  - "A session keeps the students it was taken with. A student added later does not appear in older sessions; an **archived** student keeps their status, greyed out, and cannot be changed."
  - "Sessions are grouped by month, newest first; each shows *7 of 10 present* and the rate chip (green from 80%, amber from 50%, red below)."
  - "Deleting a session removes its attendance as well, after a confirmation."
  - "The session time is the moment it was created; the student sees it next to the school name."
messages:
  - situation: "Delete a session"
    title: "Delete session"
    message: "Are you sure you want to delete this session and its attendance? This action cannot be undone."
  - situation: "No session yet"
    message: "No training sessions yet"
  - situation: "Delete failed"
    message: "Failed to delete"
flows:
  - id: take
    title: "Today's attendance"
    steps:
      - title: "Attendance"
        text: "The school dashboard opens Attendance from its tile."
        screen: School
      - title: "Sessions"
        text: "Sessions by month with how many were present. *Add new* opens today's session, or a new one when there is none yet."
        screen: AttendanceList
      - title: "Today"
        text: "Every student starts Present. Taps change the exceptions; the summary counts along."
        screen: AttendanceCreate
      - title: "Create"
        text: "The session and the attendance of every listed student are written in one transaction and synced; the app goes back to the sessions."
        screen: AttendanceCreate
        api:
          - { id: sync-push, x: 84, y: 9 }
    diagram: |
      sequenceDiagram
        actor I as Instructor
        participant A as App
        participant L as Local DB
        participant Sync as Edge Function sync
        I->>A: Add new
        A->>L: Session today already?
        alt exists
          A-->>I: Open today's session
        else none
          A->>L: Active members and members without an account
          A-->>I: Everyone Present
          I->>A: Tap the absent ones, Create
          A->>L: Session + one record per student
          A-)Sync: Push
        end
  - id: correct
    title: "Correcting a session"
    steps:
      - title: "Session"
        text: "An earlier session shows its students with their statuses; *Save* appears after a change and writes the changed list in one batch."
        screen: AttendanceDetails
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Delete"
        text: "The trash button deletes the session and its attendance after a confirmation (soft delete, synced)."
        screen: AttendanceDetails
        api:
          - { id: sync-push, x: 84, y: 9 }
  - id: student
    title: "Student's attendance"
    steps:
      - title: "Student card"
        text: "The instructor sees one student's attendance on the student card and can change it there too."
        screen: StudentDetailsAttendance
      - title: "My attendance"
        text: "From the student dashboard: number of sessions and the share present, then the sessions by month with the school, the time and the status. Only the student's own attendance reaches their device."
        screen: StudentAttendance
        api:
          - { id: sync-pull, x: 84, y: 9 }
---

<FeatureView>

## Code

| What | Where |
| --- | --- |
| Sessions (route `/school/{schoolId}/attendance`) | `app/school/[schoolId]/attendance/index.tsx`, `src/modules/attendance/components/AttendanceSessionsScreen.tsx`, `hooks/useAttendanceSessionList.ts` |
| Today's session (route `…/attendance/create`) | `AttendanceCreateScreen.tsx`, `createSessionWithAttendance` in `services/attendanceService.ts` |
| Session details (route `…/attendance/{sessionId}`) | `AttendanceSessionScreen.tsx`, `AttendanceSessionBody.tsx`, `hooks/useAttendance.ts`, `bulkSaveAttendanceList`, `deleteTrainingSession` |
| Student's attendance (route `/user/attendance`) | `app/user/attendance.tsx`, `StudentAttendanceScreen.tsx`, `hooks/useStudentAttendance.ts` |
| Grouping, counts, dates (pure logic) | `src/modules/attendance/sessionList.ts` |

## Data

| Table | Columns |
| --- | --- |
| `training_sessions` | `school_id`, `session_date`, `notes` |
| `attendance_records` | `training_session_id`, `school_member_id`, `status` (`present` / `absent` / `excused`) |

A session of the attendance register is not a [planned training](./trainings): trainings are the schedule, sessions are what happened.

## Sync

- The organization owner pushes and pulls all sessions and attendance of their schools.
- A student pulls the sessions of their school and **only their own** attendance.
- Migration `20261029000000_resync_payments_attendance` touches all live sessions and records once, so students who missed them pull them again.

## Notes

- *One session per day* is checked on the device and, for live sessions, by a unique index on the server (`school_id`, `date`). When two devices take attendance for the same day offline, the server refuses the second session; it and its attendance stay only on that device.
- Attendance sends no notifications.

</FeatureView>
