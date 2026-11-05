# Execution plan — payments: lock a period, confirm leaving Paid, stay after Save

Source doc: .ai/specs/2026-11-05-payments-lock-and-paid-confirmation.md
Refs: #76 (spec PR, merged)

## Goal
Implement the spec: confirm before a status leaves Paid (4 places), keep 14B open after Save, lock / unlock a billing period from a ⋮ menu (frozen everywhere it can be edited), and delete a period while nothing in it is Paid.

## Scope
- payments module (model field, repository, service, rules in `paymentPeriod.ts`, 14A / 14B, `PeriodActionsSheet`, `LockedBadge`)
- events (`EventParticipantsScreen`), students (`StudentDetailsScreen`, `ApproveJoinRequestSheet`, `useStudentPayments` locked flag)
- core: `confirmAction` moved to `src/core/utils`, `confirmLeavePaid`, `ListRow.disabled`, `Notice.icon`
- schema v24 + WatermelonDB migration + Supabase migration `payment_cycles.locked_at`
- translations en / pl / hu

## Non-goals
- Server-side lock enforcement (trigger) — deferred by the spec.
- Stay-after-Save on event participants (10D) — spec Q7.
- Student's own Payments screen — unchanged (spec Q9).

## Risks
- Schema change (additive, nullable). Migration version must avoid remote-history collisions.
- Tests are pure-logic only (`node --test` on `__tests__/*.test.ts`); component tests from the spec are replaced by tests of the extracted rules.

## Implementation Plan
Follows the spec's Implementation Plan steps 1–8.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Confirm leaving Paid + stay after Save

- [ ] 1.1 Move confirmAction to core, add confirmLeavePaid and leavesPaid
- [ ] 1.2 Wire the paid confirmation into the four status-button places
- [ ] 1.3 Stay on 14B after Save

### Phase 2: Lock / unlock

- [ ] 2.1 Schema v24 locked_at + migrations + model field
- [ ] 2.2 setLocked, lock/unlock service, ListRow.disabled, Notice.icon, PeriodActionsSheet behind ⋮
- [ ] 2.3 Locked states on 14B, 14A, student details, approve join

### Phase 3: Delete period

- [ ] 3.1 canDeletePeriod, softDeleteWithRecords, deletePaymentCycle, Delete row
- [ ] 3.2 Translations and gate
