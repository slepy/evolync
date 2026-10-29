---
layout: page
feature: join-school
title: Join a school
group: school
accent: school
icon: ticket
order: 10
summary: "A student types the code from their instructor and sends a request. The instructor approves it and the student becomes a member of the school."
purpose: "Students join a school by themselves; the instructor does not type in their data. Approval keeps the instructor in control of who gets in."
who:
  - role: "Student"
    outcome: "Sends a request with the school code"
  - role: "Instructor (school owner)"
    outcome: "Approves or rejects it in Students"
rules:
  - "Starts right after a student signs up, from *Join a school* on the student dashboard, or from *Join another school* in the context switcher."
  - "Needs an internet connection. Offline the screen shows a notice and *Join* is disabled."
  - "The code is letters and digits of any length; it is not case-sensitive (the app turns it into capitals). It works until it expires or the instructor deletes it."
  - "One **pending** request per school, and an active member cannot send one. After a rejection the student can send a new request, which replaces the rejected card."
  - "The student dashboard shows the request as *Pending approval* or *Rejected*; a rejected card can be dismissed. Approval arrives as *Request approved* in Alerts and as a push."
  - "The instructor can approve as a **new member** or **link to an existing member** added earlier without an account, and add the student to payment periods and events at the same time."
messages:
  - situation: "Unknown or expired code"
    title: "This code doesn't work"
    message: "It doesn't exist or has expired. Ask your instructor for a new one."
  - situation: "Request already sent"
    title: "Request already sent"
    message: "Your join request is already pending. Please wait for instructor approval."
  - situation: "Already a member"
    title: "Already a member"
    message: "You are already an active member of this school."
  - situation: "Offline"
    message: "Joining a school needs an internet connection."
flows:
  - id: request
    title: "Student sends a request"
    steps:
      - title: "No school yet"
        text: "Without a school the student dashboard offers *Join a school*."
        screen: NoSchool
      - title: "Enter the code"
        text: "The app looks for the invite on the device first; if it is not there (the instructor made it on another device), it asks Supabase for a valid, not expired code."
        screen: JoinSchoolFilled
        api:
          - { id: school-invites-by-code, x: 80, y: 93 }
      - title: "Code doesn't work"
        text: "No valid invite: the banner asks for a new code. A pending request or an active membership in that school get their own message."
        screen: JoinSchoolError
      - title: "Offline"
        text: "Without a connection the notice explains why and *Join* stays disabled."
        screen: JoinSchoolOffline
      - title: "Request sent"
        text: "The request is saved locally as *pending* and pushed by the sync; the app also fetches the school so its name can be shown."
        screen: JoinSchoolSent
        api:
          - { id: sync-push, x: 82, y: 93 }
          - { id: schools-by-id, x: 12, y: 51 }
      - title: "Instructor is notified"
        text: "A database trigger creates a notification for the school owner, and `send-push` delivers it to their phone."
        api:
          - { id: send-push }
    diagram: |
      sequenceDiagram
        actor S as Student
        participant A as App
        participant L as Local DB
        participant DB as Supabase DB
        participant Sync as Edge Function sync
        participant P as send-push
        S->>A: Code, Join
        A->>L: Invite with this code?
        alt not on the device
          A->>DB: school_invites by code (not expired)
        end
        alt no valid invite
          A-->>S: This code doesn't work
        else invite found
          A->>L: Request or membership already there?
          alt yes
            A-->>S: Request already sent / Already a member
          else no
            A->>L: Create join request (pending)
            A-->>S: Request sent
            A-)Sync: Push the request
            Sync->>DB: Insert school_join_requests
            DB->>DB: Notification for the school owner
            DB-)P: Push to the instructor
            A-)DB: Fetch the school if missing locally
          end
        end
  - id: decision
    title: "Instructor decides"
    steps:
      - title: "New join request"
        text: "The instructor sees *New join request* in Alerts (and as a push) and opens it in Students."
        screen: NotificationsOrg
      - title: "Approve or reject"
        text: "Approve creates an active member with the Student role, or activates an offline member with the student's account; the student can be added to payment periods and events. Reject marks the request *Rejected*. Either way the change goes out with the sync."
        screen: StudentsRequests
        api:
          - { id: sync-push, x: 85, y: 47 }
      - title: "Student's dashboard"
        text: "The student gets *Request approved: You're now a member of …* in Alerts and as a push. The school appears at once: the app watches the student's own memberships in the local database, and the sync pulls the new school's data in full."
        screen: Student
        api:
          - { id: send-push }
          - { id: sync-pull, x: 86, y: 10 }
    diagram: |
      flowchart TD
        req[Join request<br/>Pending] --> decide{Instructor}
        decide -- Approve --> mode{New or existing member?}
        mode -- new --> create[Create active member<br/>with the Student role]
        mode -- existing --> link[Activate the offline member<br/>with the student's account]
        create --> extra[Add to selected payment<br/>periods and events]
        link --> extra
        extra --> del[Remove the request]
        decide -- Reject --> rej[Request marked Rejected<br/>visible to the student]
        del --> sync[Sync]
        rej --> sync
---

<FeatureView>

## Code

| What | Where |
| --- | --- |
| Route `/school/join` (`from=signup`) | `app/school/join.tsx` |
| Screens | `src/modules/school/components/JoinSchoolScreen.tsx`, `JoinRequestSent.tsx` |
| Error texts | `src/modules/school/components/joinSchoolError.ts` |
| Join logic | `src/modules/school/services/joinSchoolService.ts`, `hooks/useJoinSchool.ts` |
| Requests (local DB) | `src/modules/school/repositories/schoolJoinRequestRepository.ts` |
| Approve / reject | `approveJoinRequest`, `rejectJoinRequest` in `src/modules/students/services/studentService.ts`, `ApproveJoinRequestSheet.tsx` |
| Request card on the student dashboard | `src/modules/dashboard/components/StudentDashboard.tsx` |
| Owner notification (SQL) | `notify_join_request_created` in `supabase/migrations/20261001000000_notifications.sql` |

## Tables

| Table | Role |
| --- | --- |
| `school_invites` | Codes: `school_id`, `role_id`, `code`, `expires_at` |
| `school_join_requests` | Requests: `school_id`, `user_id`, `display_name`, `email`, `status` (`pending` / `rejected`) |
| `school_members` | Created or activated on approval |

## Notes

- **Join requests did not reach the server from 2026-09-28** until migration `20261026000200`: the app sent a `status` column the table did not have, and the sync dropped the request. The migration adds the column and limits uniqueness to pending requests; a one-time repair (`src/database/resendJoinRequests.ts`) pushes the requests lost on each device again.
- The duplicate checks run on the local database only. On a device that has never synced this user's records they let the request through, and the unique constraints in Supabase are the backstop.
- The approval notification (`join_request_approved`) is created by a trigger on the student's `school_members` row (migration `20261026000000`); `useOwnMembershipsWatcher` adds the new school to the context switcher without signing in again.

</FeatureView>
