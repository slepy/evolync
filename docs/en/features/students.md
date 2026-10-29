---
layout: page
feature: students
title: Students
group: school
accent: students
icon: users
order: 11
summary: "The instructor's list of a school's students: invite codes, join requests, students added without an account, and each student's card with rank, fee, payments, attendance, orders and events."
purpose: "One place where the instructor runs a school's people: lets students in with a code, adds the ones who will never install the app, and sees and changes everything about one student."
who:
  - role: "Instructor (organization owner)"
    outcome: "Only the owner opens Students; anyone else is sent back"
  - role: "Student"
    outcome: "Appears on the list after approval, or is added by the instructor without an account"
rules:
  - "The list shows members with an account first, then pending ones, then students without an account, each by name. **Archived** students are hidden. Search matches name and email, ignoring case and Polish letters."
  - "A school has **one active invite code**. A new code replaces the old one at once. Codes are 6 letters and digits and stay valid for 1, 7 or 30 days."
  - "The *Requests* tab shows pending join requests with a count; a notification about a new request opens this tab."
  - "Approving lets the instructor link the request to a student **added earlier without an account**, so the history (payments, attendance) stays with one person, and add the student to the current payment periods and upcoming events in the same step."
  - "A student **without an account** is ready at once, also offline, shows as *No account* and can have attendance and payments recorded."
  - "Only students without an account can be edited; people with an account keep their own name, email and phone."
  - "**Archive** hides a student from lists and keeps the whole history."
  - "A student can have their **own payment amount** (e.g. half for a child) for new payment periods; existing payments keep their amounts."
  - "Rank and the statuses of payments, attendance and events change on tap and are stored with *Save*."
messages:
  - situation: "Code copied"
    title: "Copied"
    message: "Code K7M42Q copied to clipboard"
  - situation: "Code could not be created"
    message: "Failed to generate invite code. Please try again."
  - situation: "Reject a request"
    title: "Reject Request"
    message: "The student will see the request as rejected and can send a new one with a code."
  - situation: "Approve as an existing student without choosing one"
    message: "Please select an existing student."
  - situation: "No student without an account to link"
    message: "No offline students found in this school."
  - situation: "Archive a student"
    title: "Archive student"
    message: "This student will be archived and removed from the active student list. Their history will be preserved."
flows:
  - id: invite
    title: "Invite code"
    steps:
      - title: "Students"
        text: "The school dashboard opens Students from its tile."
        screen: School
      - title: "Active code"
        text: "The card on top shows the school's active code and its expiry. *Copy* puts it on the clipboard to send to students."
        screen: StudentsList
      - title: "New code"
        text: "The square button next to *Add new* opens a new code."
        screen: StudentsList
      - title: "Valid for 1, 7 or 30 days"
        text: "The code is drawn on the device (6 characters, A–Z and 0–9) and checked against the codes stored locally. The school's previous code is invalidated, the new one is saved locally and synced."
        screen: StudentInviteCreate
        api:
          - { id: sync-push, x: 82, y: 77 }
      - title: "The student uses it"
        text: "The student types the code in [Join a school](./join-school); a code made on another device is looked up in Supabase."
        screen: JoinSchoolFilled
        api:
          - { id: school-invites-by-code, x: 80, y: 93 }
    diagram: |
      sequenceDiagram
        actor I as Instructor
        participant A as App
        participant L as Local DB
        participant Sync as Edge Function sync
        actor S as Student
        I->>A: New invite code, valid for 7 days
        A->>A: Draw a 6-character code
        A->>L: Code already used?
        A->>L: Invalidate the school's active code
        A->>L: Save the new code
        A-)Sync: Push the code
        I-->>S: Sends the code
        S->>A: Join a school with the code
  - id: requests
    title: "Join requests"
    steps:
      - title: "Requests"
        text: "The *Requests* tab lists pending requests with when they came; the badge counts them."
        screen: StudentsRequests
      - title: "Approve"
        text: "Approve opens a sheet: **new student** or **existing student** (one added without an account), the payment periods running today and the upcoming events. A new member gets the Student role; an existing one is activated with the student's account. Payment records get the student's own amount or the school default; event participants start as absent. The request is removed, everything goes out with the sync, and the student gets *Request approved*."
        screen: StudentsRequests
        api:
          - { id: sync-push, x: 85, y: 47 }
      - title: "Reject"
        text: "After a confirmation the request is marked *Rejected*; the student sees it on their dashboard and can send a new request with a code, which replaces the rejected one."
        screen: StudentsRequests
        api:
          - { id: sync-push, x: 70, y: 47 }
    diagram: |
      flowchart TD
        req[Join request] --> act{Instructor}
        act -- Approve --> type{New or existing student?}
        type -- new --> create[Active member<br/>with the Student role]
        type -- existing --> link[Student without an account<br/>gets the account, becomes active]
        create --> extra[Selected payment periods<br/>and upcoming events]
        link --> extra
        extra --> done[Request removed]
        act -- Reject --> rej[Request marked Rejected]
        done --> sync[Sync]
        rej --> sync
  - id: offline
    title: "Student without an account"
    steps:
      - title: "Add new"
        text: "*Add new* on the list opens the form."
        screen: StudentsList
      - title: "New student"
        text: "Full name (2–100 characters) is required; email and phone are optional. The note explains that the student shows as *No account* at once."
        screen: StudentCreate
        api:
          - { id: sync-push, x: 82, y: 83 }
      - title: "On the list"
        text: "The student is on the list with the *No account* pill and can be marked in attendance and payments. When they join with a code later, the instructor links them while approving."
        screen: StudentsList
    diagram: |
      sequenceDiagram
        actor I as Instructor
        participant A as App
        participant L as Local DB
        participant Sync as Edge Function sync
        I->>A: Name, email, phone, Create
        A->>L: Student role of the organization
        A->>L: Member with status offline (No account)
        A-->>I: Back to the list
        A-)Sync: Push the member
  - id: card
    title: "Student card"
    steps:
      - title: "Student"
        text: "Contact, rank, the student's payment amount and four tabs: payments, attendance, orders and events. A tap on a status cycles it; *Save* appears once something changed."
        screen: StudentDetails
        api:
          - { id: sync-push, x: 86, y: 82 }
      - title: "Rank"
        text: "The rank sheet lists the organization's ranks in their belt colors; the choice is saved with *Save*."
        screen: StudentRankSheet
      - title: "Edit or archive"
        text: "The ⋯ menu: *Edit* (students without an account only) and *Archive*, which hides the student and keeps the history."
        screen: StudentActionsSheet
        api:
          - { id: sync-push, x: 50, y: 92 }
---

<FeatureView>

## Code

| What | Where |
| --- | --- |
| Students and requests (route `/school/{schoolId}/students`, `?tab=requests`) | `app/school/[schoolId]/students/index.tsx`, `src/modules/students/components/StudentsScreen.tsx` |
| Data of the screen | `src/modules/students/hooks/useStudentsOverview.ts` |
| List order, status pill, request age | `src/modules/students/studentList.ts` |
| New invite code (route `…/students/generate-invite`) | `InviteCreateScreen.tsx`, `InviteCodeCard.tsx`, `src/modules/school/services/inviteService.ts` |
| Approve / reject | `ApproveJoinRequestSheet.tsx`, `approveJoinRequest`, `rejectJoinRequest` in `services/studentService.ts` |
| New / edit student (routes `…/students/create`, `…/{studentId}/edit`) | `StudentFormScreen.tsx`, `validation/studentSchema.ts`, `createStudent`, `updateStudent` |
| Student card (route `…/students/{studentId}`) | `StudentDetailsScreen.tsx`, `StudentRankSheet.tsx`, `StudentPaymentAmountSheet.tsx`, `StudentActionsSheet.tsx` |
| Members (local DB) | `src/modules/students/repositories/studentRepository.ts` |

Everything is written to the local database first and synced in the background; only the code lookup of [Join a school](./join-school) reads Supabase directly.

## Member statuses

| Status | Meaning | On the list |
| --- | --- | --- |
| `active` | Member with an app account | no pill |
| `offline` | Added by the instructor, no account | *No account* |
| `pending` | Waiting | *Pending* |
| `rejected` | Rejected | *Rejected* |
| `archived` | Archived, history kept | hidden |

## Notes

- Field errors of the student form are translation keys (`nameTooShort`, `nameTooLong`, `invalidEmail`, `emailTooLong`), translated when shown, with the length limit as `{{count}}`.
- **Code uniqueness is checked on the device only.** Two devices could draw the same code; with 36⁶ possibilities this is unlikely. If no free code is found after 5 tries, the screen shows *Failed to generate invite code*.
- The Student role is read from the local database; a device that has not synced the organization's roles yet creates the member without a role.

</FeatureView>
