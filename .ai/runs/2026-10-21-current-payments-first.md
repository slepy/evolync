# Current payments first

## Goal

Current billing periods (today inside the period, the "CURRENT" badge) appear at the top of the school's payments list (14A) and of the Payments tab in student details, as well as the student's own Payments screen (same hook).

## Scope

- Pure helper `currentPeriodsFirst` in `src/modules/payments/paymentPeriod.ts` (stable: current periods first, the rest keep their newest-first order), unit-tested.
- Apply it in `usePaymentPeriodList` (14A) and `useStudentPayments` (student details tab + student's own Payments screen).

## Non-goals

- No change to period creation, the badge, the summaries or the repositories' query order.

## Implementation Plan

### Phase 1: Current periods on top

1. Add `currentPeriodsFirst` with tests.
2. Use it in both hooks.

## Risks

- "Today" is computed when the list is built; a list left open past midnight keeps the old order until it re-renders — same as the CURRENT badge.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Current periods on top

- [x] 1.1 Add currentPeriodsFirst helper with tests — 948ee44
- [x] 1.2 Sort current periods first in both payment hooks — 948ee44
