---
layout: page
feature: student-dashboard
title: Student dashboard
group: student
accent: student
icon: user
order: 30
summary: "The student's home: in a school, what comes next (events and trainings), tiles for their payments, attendance and orders, and the technique notebook. Without a school, the Join a school box and the requests waiting for approval."
purpose: "Shows a student their club life at a glance and works offline, for people who never run a school themselves."
who:
  - role: "Student"
    outcome: "Sees the next event and training, opens their payments, attendance, orders and notebook, joins a school"
  - role: "Instructor training elsewhere"
    outcome: "Gets the same dashboard after switching to a school under *TRAIN AS STUDENT*"
rules:
  - "**In a school** (blue context): the context switcher with the school name, *Next up* with the nearest event and training, tiles **Payments**, **Attendance**, **Orders**, then the [technique notebook](./notes)."
  - "**Without a school** (neutral context): *My dashboard*, a box *You're not enrolled in any school yet* with *Join a school*, and the notebook."
  - "Join requests still waiting for the instructor are listed under the box until they are decided; a rejected request says so and a new one can be sent."
  - "The calendar icon in *Next up* opens the student's [Calendar](./calendar); an event opens its details, where the student answers *Attending* or *Absent* (see [Events](./events))."
  - "Everything the student sees is their own data: only their payments, attendance and orders reach their device."
flows:
  - id: home
    title: "Dashboard"
    steps:
      - title: "No school yet"
        text: "Right after sign-up: the *Join a school* box and the notebook; pending requests appear under the box."
        screen: NoSchool
      - title: "In a school"
        text: "*Next up* with the event and the training, then the tiles. The Synced pill shows whether everything is on the server."
        screen: Student
        api:
          - { id: sync-pull, x: 84, y: 10 }
      - title: "Payments"
        text: "Read-only: periods with their amount and status, and what is still to pay (see [Payments](./payments))."
        screen: StudentPayments
      - title: "Attendance"
        text: "Read-only: sessions by month and the share present (see [Attendance](./attendance))."
        screen: StudentAttendance
---

<FeatureView>

## Code

| What | Where |
| --- | --- |
| Student dashboard (route `/user/dashboard`) | `app/user/dashboard.tsx`, `src/modules/dashboard/components/StudentDashboard.tsx`, `NoSchoolCard.tsx` |
| Active membership (which school) | `getActiveMembership()` in the store, `activeMembershipId` in AsyncStorage |
| Student screens | `/user/payments`, `/user/attendance`, `/user/orders`, `/user/events`, `/user/calendar` |
| Notebook section | `TechniqueNotebook` in `src/core/components` |

</FeatureView>
