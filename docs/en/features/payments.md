---
layout: page
feature: payments
title: Payments
group: school
accent: payments
icon: credit-card
order: 12
summary: "Billing periods of a school: the instructor opens a month, week, year or any range, every student gets a payment in it, and the instructor marks who paid, how and how much. Students see their own payments."
purpose: "Replaces the paper list of who paid this month. Payments are recorded by hand (cash, transfer, other); the app does not take money."
who:
  - role: "Instructor (organization owner)"
    outcome: "Creates billing periods, marks payments, edits amounts and methods, sets the school's default amount"
  - role: "Student"
    outcome: "Gets a *New payment* notification and sees their own payments, read-only, with the amount still to pay"
rules:
  - "A **billing period** has a start and an end: *This month*, *This week* (Monday to Sunday), *This year* or a **custom** range. A school cannot have two periods with the same dates."
  - "Creating a period adds a **Pending** payment, method *Cash*, for every student who is active or has no account. Pending and archived members are left out."
  - "The amount of each payment: the period's **own amount** when *Use default amounts* is off, else the student's **own amount** (set on the student card), else the **school default** from *School settings*."
  - "A student who joins later is **not** added to existing periods by itself; the instructor adds them to the current periods while approving their request."
  - "A tap on the status button cycles **Pending → Paid → Cancelled**; a tap on the name opens the amount, currency and method. Nothing is stored until *Save*, which appears after a change."
  - "The **payment date** is set when a payment becomes *Paid*; changing the amount or method of a paid payment keeps the date."
  - "The period list shows current periods first, then the newest; the chip *6/10* is green from 80% paid, amber from 50%, red below."
  - "Amounts are summed **per currency**: a period can mix PLN and EUR, the totals are never converted."
  - "Students see only their own payments. *… to pay* sums their pending payments."
  - "A tap that would move a payment **out of Paid** first asks *Change a paid status?*; *Cancel* leaves the row as it is. The same question guards a *Paid* event participant (see [Events](./events))."
  - "The **⋮ menu** of a period offers *Lock payments* / *Unlock payments*. A locked period freezes every status and amount: the status buttons are dimmed, rows do not open the edit sheet, the periods list shows a *Locked* badge, the student card shows a lock, and the approval of a join request does not offer the period. *Lock* is disabled while there are unsaved changes."
  - "*Delete period* is in the same menu and works only while the period is **unlocked** and **no payment in it is Paid**; it asks first and removes the period with its payments."
messages:
  - situation: "A period with the same dates exists"
    message: "A payment cycle with this period already exists"
  - situation: "Custom period ends before it starts"
    message: "End date must be after start date"
  - situation: "Amount is not a number (at most 2 decimals)"
    message: "Amount must be a number"
  - situation: "No period yet"
    message: "No payment cycles yet"
  - situation: "A payment leaves Paid"
    title: "Change a paid status?"
    message: "Anna Kowalska is marked as paid. Change the status to Cancelled?"
  - situation: "Delete period is not possible"
    message: "6 payments are paid, so this period can't be deleted."
  - situation: "Student: a new payment"
    title: "New payment"
    message: "150 PLN for 1 – 31 Oct"
flows:
  - id: new-period
    title: "New billing period"
    steps:
      - title: "Payments"
        text: "The school dashboard opens Payments from its tile; the tile's `+` goes straight to a new period."
        screen: School
      - title: "Billing periods"
        text: "Current periods on top with *CURRENT*, then the newest. Each row shows how many paid; *Add new* opens a new period."
        screen: PaymentsList
      - title: "Period"
        text: "*This month*, *This week* or *This year*, each with its dates. Below, the *Amount* card: *Use default amounts* (each student's own amount or the school default) or, switched off, one amount and currency for everyone in this period."
        screen: PaymentCreate
      - title: "Custom range"
        text: "*Custom* shows START and END; an end before the start is refused."
        screen: PaymentCreateCustom
      - title: "Create"
        text: "The period and a Pending payment for every active student or student without an account are written in one transaction, then synced. The app opens the new period."
        screen: PaymentDetails
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Students are notified"
        text: "For each payment of a student with an account, the database writes a *New payment* notification and sends it as a push."
        screen: NotificationsStudent
        api:
          - { id: send-push, x: 85, y: 22 }
    diagram: |
      sequenceDiagram
        actor I as Instructor
        participant A as App
        participant L as Local DB
        participant Sync as Edge Function sync
        participant DB as Supabase DB
        I->>A: This month, default amounts, Create
        A->>L: Same dates already?
        A->>L: School default amount
        A->>L: Active members and members without an account
        A->>L: Period + one Pending payment each
        A-->>I: Period details
        A-)Sync: Push the period and payments
        Sync->>DB: Insert (a period with the same dates is skipped)
        DB->>DB: New payment notification per student with an account
  - id: collect
    title: "Marking payments"
    steps:
      - title: "Period"
        text: "The summary counts Paid, Pending and Cancelled. Students are listed by name with the amount and, once paid, the method."
        screen: PaymentDetails
      - title: "Status"
        text: "A tap on the round button moves the payment to the next status: Pending → Paid → Cancelled → Pending."
        screen: PaymentDetails
      - title: "Amount and method"
        text: "A tap on the name opens the student's payment: amount, currency and method (*Cash*, *Transfer*, *Other*). *Save* in the sheet only changes the list on screen."
        screen: PaymentEditSheet
      - title: "Amounts"
        text: "*Amounts* expands the totals per status and currency: collected, pending, cancelled."
        screen: PaymentDetailsAmounts
      - title: "Save"
        text: "*Save* under the list writes the changed payments in one batch, sets the payment date of the ones that became Paid and syncs. The app stays on the period; the *Save* button disappears until the next change."
        screen: PaymentDetailsAmounts
        api:
          - { id: sync-push, x: 84, y: 9 }
    diagram: |
      flowchart TD
        list[Period details] --> tap{Tap}
        tap -- status button --> next[Next status<br/>on screen only]
        tap -- name --> sheet[Amount, currency, method<br/>on screen only]
        next --> changed[Save appears]
        sheet --> changed
        changed --> save[Save: changed payments<br/>in one batch]
        save --> date[Payment date<br/>for newly paid]
        date --> sync[Sync]
  - id: close
    title: "Locking and deleting a period"
    steps:
      - title: "Paid status"
        text: "A tap on a *Paid* status asks first; *Change* applies the next status on screen, *Cancel* keeps Paid."
        screen: PaymentPaidConfirm
      - title: "Period menu"
        text: "The ⋮ button opens *Lock payments* and *Delete period*. *Delete period* is dimmed with the reason while a payment is paid or the period is locked."
        screen: PaymentPeriodActions
      - title: "Locked period"
        text: "An amber notice explains the lock, the status buttons are dimmed and the rows no longer open the edit sheet. *Unlock payments* in the menu undoes it."
        screen: PaymentDetailsLocked
  - id: amounts
    title: "Default amounts"
    steps:
      - title: "School default"
        text: "*School settings* hold the default amount and currency. New periods use them; existing periods keep their amounts."
        screen: SchoolSettings
        api:
          - { id: sync-push, x: 84, y: 9 }
      - title: "Student's own amount"
        text: "On the student card the instructor can set the student's own amount (e.g. half for a child). It is used for new periods instead of the school default."
        screen: StudentDetails
  - id: student
    title: "Student's payments"
    steps:
      - title: "Notification"
        text: "*New payment* with the amount and the period; a tap opens the student's payments."
        screen: NotificationsStudent
      - title: "My payments"
        text: "From the student dashboard: the summary of the student's periods with the amount still to pay, then each period with its amount and status. Read-only; only the student's own payments reach their device."
        screen: StudentPayments
        api:
          - { id: sync-pull, x: 84, y: 9 }
---

<FeatureView>

## Code

| What | Where |
| --- | --- |
| Billing periods (route `/school/{schoolId}/payments`) | `app/school/[schoolId]/payments/index.tsx`, `src/modules/payments/components/PaymentPeriodsScreen.tsx`, `hooks/usePaymentPeriodList.ts` |
| New period (route `…/payments/create`) | `PaymentPeriodFormScreen.tsx`, `createPaymentCycle` in `services/paymentService.ts` |
| Period details (route `…/payments/{cycleId}`) | `PaymentPeriodScreen.tsx`, `PaymentEditSheet.tsx`, `hooks/usePaymentRecords.ts`, `bulkSavePaymentList` |
| Student's payments (route `/user/payments`) | `app/user/payments.tsx`, `StudentPaymentsScreen.tsx`, `PaymentRow.tsx`, `hooks/useStudentPayments.ts` |
| Period menu, lock badge | `PeriodActionsSheet.tsx`, `LockedBadge.tsx`, `lockPaymentCycle` / `unlockPaymentCycle` / `deletePaymentCycle` in `services/paymentService.ts` |
| Periods, amounts, statuses (pure logic) | `src/modules/payments/paymentPeriod.ts` |
| Validation | `src/modules/payments/validation/paymentSchema.ts` |
| School default amount | `src/modules/school/components/SchoolSettingsScreen.tsx` |
| Notification | `notify_payment_created` in `supabase/migrations/20261001000000_notifications.sql` |

## Data

| Table | Columns |
| --- | --- |
| `payment_cycles` | `school_id`, `period_start`, `period_end`, `notes`, `locked_at` |
| `payment_records` | `payment_cycle_id`, `school_member_id`, `amount`, `currency`, `status` (`pending` / `paid` / `cancelled`), `method` (`cash` / `transfer` / `other`), `payment_date` |

A period has no amount of its own: the amount chosen when creating it is written to each payment.

## Sync

- The organization owner pushes and pulls all periods and payments of their schools.
- A student pulls the periods of their school and **only their own** payments.
- The server skips a pushed period whose school and dates match an existing one, together with its payments. Two devices that create the same month offline keep the second one only locally.

## Notes

- The period details show only students who have a payment in the period; a student added later appears after the instructor adds them while approving a request.
- The payment screens of a school do not have the owner guard that Students has (`useRequireOrganizationOwner`); the school dashboard is the only way in.
- The lock is enforced **in the app only** (migration `20261105000000_payment_cycles_locked_at`): an offline device on an old build can still change a locked period's payments.

</FeatureView>
