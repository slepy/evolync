# Orders — list, shopping list, status, details, new order, add product (12A–12F)

Engine: om-auto-create-pr (steps: 10, --loop: no)

## Goal

Rebuild the Orders module screens on the shared design components (boards 12A–12F) for the three places Orders opens from — organization, school and student dashboard — with the permissions below.

## Brief (operator, translated)

> Orders — list, shopping list, status, details, new order, add product (design artifact). I want to implement the orders module; it is present in 3 places (organization, school and the student dashboard).
> 1. From the organization we cannot add new orders (no Add new button).
> 2. From the organization I see the orders of every school.
> 3. From a school I have full access to that school's orders and can add new ones.
> 4. From the school and the organization I can fully edit an order.
> 5. From the student I can add new orders and edit my own (only in a specific status — already in the code).
> Follow how lists are built in the design (one note: if the user has a photo, show it instead of the initials).

## Design source

The design artifact (`claude.ai/artifact/5GM35Pr9XwTRWQAez7pCWx`) is not shared with this session (Docs read → access denied). The layout follows the board names (12A Orders: status chips with counts · 12B Shopping list: products like the orders list, Copy · 12C status · 12D details · 12E / 12E1 / 12E2 new order with the Student select sheet · 12F Add product: tap to expand sizes, set quantity, Add) and the `design-mockups` skill (list, select field, sub-screen and form rules). Exact copy and spacing may differ from the boards.

## Scope

- Shared: `ListAvatar` gets an optional photo (`uri`) and falls back to initials; existing people rows (event participants, training details, audience member list) pass the member photo.
- `src/modules/orders`: pure logic (`orderListState.ts`: status counts / filter / shopping list / copy text; `orderAccess.ts`: who may add / edit / delete; `orderCart.ts`: cart edits and the save diff) with tests; new screens `OrdersScreen` (12A + 12B), `OrderDetailsScreen` (12D) + `OrderStatusSheet` (12C), `OrderFormScreen` (12E) + `StudentSelectSheet` (12E1), `AddProductSheet` (12F).
- Routes made thin: `app/organization/orders/index.tsx` (+ new `[orderId].tsx`), `app/school/[schoolId]/orders/{index,create,[orderId]}.tsx`, `app/user/orders/{index,create,[orderId]}.tsx`.
- Permissions: organization — all schools, no Add new, full edit; school — that school, Add new, full edit; student — own orders, Add new, edit / delete only while `placed` (existing rule), status read-only.
- Old orders UI no longer used removed; translation keys added (en + pl) and unused ones removed.

## Non-goals

- Order data model, repositories' queries, sync, Supabase / RLS changes.
- Online payments, stock reservation, notifications on status change.
- Changing the student edit rule (stays: editable only in `placed`).

## Implementation Plan

### Phase 1: Shared avatar and order logic

- 1.1 `ListAvatar` photo with initials fallback; pass member photos in existing people rows.
- 1.2 `orderListState.ts` + `orderAccess.ts` + `orderCart.ts` with unit tests.

### Phase 2: Screens 12A–12F

- 2.1 `OrdersScreen` (12A orders with status chips, 12B shopping list with Copy) + list routes for organization / school / student.
- 2.2 `AddProductSheet` (12F: products, tap to expand sizes, set quantity, Add).
- 2.3 `OrderDetailsScreen` (12D) + `OrderStatusSheet` (12C) + detail routes (organization, school, student).
- 2.4 `OrderFormScreen` (12E) + `StudentSelectSheet` (12E1 / 12E2) + create routes (school, student).

### Phase 3: Cleanup and gate

- 3.1 Remove old orders UI and unused translation keys; add new keys (en + pl).
- 3.2 Update CLAUDE.md shared-components line; full validation gate.

## Risks

- Design boards not readable in this session — layout is an interpretation of the board titles and the design-mockups rules; review against the canvas.
- Organization detail moves from `/school/{id}/orders/{orderId}` to `/organization/orders/{orderId}`; any deep links to the old path for org owners still work (school route kept).

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Shared avatar and order logic

- [x] 1.1 `ListAvatar` photo with initials fallback; pass member photos in existing people rows — 06f200f
- [x] 1.2 `orderListState.ts` + `orderAccess.ts` + `orderCart.ts` with unit tests — 232fc18

### Phase 2: Screens 12A–12F

- [x] 2.1 `OrdersScreen` (12A + 12B) + list routes — 00aa407
- [x] 2.2 `AddProductSheet` (12F) — 6d315c8
- [x] 2.3 `OrderDetailsScreen` (12D) + `OrderStatusSheet` (12C) + detail routes — 690ef38
- [x] 2.4 `OrderFormScreen` (12E) + `StudentSelectSheet` (12E1 / 12E2) + create routes — 0d292dc

### Phase 3: Cleanup and gate

- [ ] 3.1 Remove old orders UI and unused translation keys; add new keys (en + pl)
- [ ] 3.2 Update CLAUDE.md shared-components line; full validation gate
