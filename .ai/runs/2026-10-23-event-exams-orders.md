# Execution plan — Event exams & event-linked orders

Source doc: .ai/specs/2026-10-22-event-exams-and-orders.md
Designs: commit 88ccd2a (`design/project/EventParticipantsExams.dc.html` 10D1, `OrderCreateEvent*.dc.html`, EventCreate / EventEdit / EventDetails / OrderDetails / OrdersOrg / StudentDetailsOrders boards)

## Goal

An event can be marked "Exams planned"; on 10D each participant gets a "Takes exam" switch, exam takers get **Add order**, their event orders are listed under the row, and orders show their event in lists and details.

## Override of the spec (user decision, 2026-10-23)

- **Q4 changed:** "Takes exam" writes right away (as in the spec and the 10D1 board). **Event orders are drafts:** Add order (12E from the event) and an order status change on 10D are kept in memory (a Zustand store in the orders module, per event) and written to WatermelonDB — and so pushed to Supabase by sync — only when the participants **Save** is pressed. Back without Save drops them.
- Save on 10D appears when participation statuses **or** event orders changed; it commits the order drafts (one `database.write` batch) and then the statuses.
- A draft order row on 10D opens the same form again (edit the products); removing all its products and saving drops the draft. Saved orders open their details (12D), which keeps its own Save.
- The 10D hint text says that Takes exam saves right away and orders save with Save.

## Scope

- events module: `exams_planned`, `takes_exam`, form toggle, details chip, Takes exam switch, exam-taker line, draft-preserving participants hook, `renderParticipantContent` slot + extra-changes Save hook-in.
- orders module: `event_id`, event order drafts store + commit service, `EventParticipantOrders`, `OrderFormScreen` fixed student / event / draft submit, event on order lists and details.
- Routes: participants route composition, `app/organization/events/[eventId]/orders/create.tsx`, order-details routes map `onOpenEvent`.
- Supabase migration `20261023000000_event_exams_orders.sql` and sync edge function changes (student push sanitizers, push order). **Not deployed by this run** (deploying to production needs the owner).

## Non-goals

Exam results / promotions (Q7), attaching existing orders to an event (Q6), student event screen changes (Q5), persisting drafts across app restarts.

## Implementation Plan

### Phase 1: Exam flags
1.1 Schema v23 + models + Supabase migration (events.exams_planned, event_participants.takes_exam, orders.event_id — folded into v23 since nothing has shipped).
1.2 Sync: student push sanitizers (takes_exam, orders.event_id), event_types/events pushed before orders; Deno tests.
1.3 Event form "Exams planned" toggle (state, schema, DTOs, service, dirty check) + translations + tests.
1.4 Details chip "Exams planned" + helper test.
1.5 Draft-preserving participants hook; `takesExam` on `ParticipantWithMember`; test of the merge helper.
1.6 Takes exam switch (repository observeWithColumns, service + hook method, ToggleRow rows, "N take the exam" line) + tests.

### Phase 2: Event-linked orders (drafts until Save)
2.1 Order model `eventId`, `OrderRepository.observeByEventId`, `createOrderSchema.eventId`.
2.2 Event order drafts store + pure helpers (add / update / remove draft, status change, has changes) + tests.
2.3 Commit service `commitEventOrderDrafts` (exam-taker check, one batch, sync) + tests.
2.4 `useEventOrders` + grouping helper + tests.
2.5 `EventParticipantOrders` + slot + participants route wiring (Save commits drafts) + visibility helper tests.
2.6 Create route + `OrderFormScreen` fixed student / event / draft submit + `useMemberSchoolId` + helper test.
2.7 Event on order lists (entries + OrderRow line) + mapping test.
2.8 Event on order details + `onOpenEvent` routes + target helper test.
2.9 Gate: typecheck, check:theme, Jest, Deno tests.

## Risks

- Drafts live in memory only: killing the app before Save loses them (by design of the override).
- Deploy order: the Supabase migration and the `sync` function must be deployed before an app build with schema v23 ships.
- Two save models on one screen (Takes exam immediate, orders + statuses on Save) — flagged for QA.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Exam flags

- [ ] 1.1 Schema v23, models, Supabase migration
- [ ] 1.2 Sync guards and push order
- [ ] 1.3 Event form Exams planned toggle
- [ ] 1.4 Details chip
- [ ] 1.5 Draft-preserving participants hook
- [ ] 1.6 Takes exam switch

### Phase 2: Event-linked orders

- [ ] 2.1 Order eventId, repository, schema
- [ ] 2.2 Event order drafts store
- [ ] 2.3 Commit service
- [ ] 2.4 useEventOrders
- [ ] 2.5 EventParticipantOrders and participants route
- [ ] 2.6 Create route and OrderFormScreen event mode
- [ ] 2.7 Event on order lists
- [ ] 2.8 Event on order details
- [ ] 2.9 Validation gate
