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

## Deviations from the spec
- Sync function: `convertOrDeleteTimestamp` drops null timestamps, so an unlock would never reach the server; `locked_at` gets its own nullable conversion (sent as null when present, left out for older builds) + deno test.
- 14B3 hint "Locked on {date}. Statuses and amounts can't be changed." comes from the board (new key `paymentsLockedHint`).
- `StatusButton` gains `dimmed` so a lock fades the buttons without dimming them during every Save.
- `PaymentPeriodScreen` gets `onDeleted` (back to 14A) in place of `onSaved`.

## Risks
- Schema change (additive, nullable). Migration version must avoid remote-history collisions.
- Tests are pure-logic only (`node --test` on `__tests__/*.test.ts`); component tests from the spec are replaced by tests of the extracted rules.

## Implementation Plan
Follows the spec's Implementation Plan steps 1–8.

## Progress

PR: #77

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Confirm leaving Paid + stay after Save

- [x] 1.1 Move confirmAction to core, add confirmLeavePaid and leavesPaid — 4c2dd0f
- [x] 1.2 Wire the paid confirmation into the four status-button places — 5ad8ccc
- [x] 1.3 Stay on 14B after Save — 8d03738

### Phase 2: Lock / unlock

- [x] 2.1 Schema v24 locked_at + migrations + model field — db78513
- [x] 2.2 setLocked, lock/unlock service, ListRow.disabled, Notice.icon, PeriodActionsSheet behind ⋮ — 5c56f32, da0ec8c
- [x] 2.3 Locked states on 14B, 14A, student details, approve join — fcfc857, 6da03e5

### Phase 3: Delete period

- [x] 3.1 canDeletePeriod, softDeleteWithRecords, deletePaymentCycle, Delete row — da0ec8c, fcfc857
- [x] 3.2 Translations and gate — 5ad8ccc, fcfc857
