# Orders Module — Specification (as-built + remediation)

## 📝 TLDR
Documents current behavior of `src/modules/orders/` — equipment orders placed by a student (self-service) or an instructor (on behalf of a student), with line items snapshotting price/currency at order time, and a 5-status lifecycle (`placed → paid → processing → ready_for_pickup → completed`) managed manually by the instructor with no enforced transition order — confirmed as intentional (instructor discretion). Stock quantity is shown but never enforced or decremented — also confirmed intentional.

Several fixes have already landed during this pass:
- A broken type import and a duplicate-export ambiguity (both real TypeScript compile errors) were fixed.
- A missing WatermelonDB migration step for `orders`/`order_items` was added (a device migrating its local schema from an older version would otherwise never receive these tables).
- **The module now owns its own schema**: `src/modules/orders/database/schema.ts` was created (matching every other module's convention) and the stale duplicate `orders`/`order_items` definitions were removed from `organization/database/schema.ts`, where they'd drifted to. This same cleanup also caught and fixed a **duplicate-table defect** introduced by an earlier pass of the `payments` module spec (which had added its own `payments/database/schema.ts` without first removing the pre-existing, differently-located `payment_cycles`/`payment_records` definitions still sitting in `organization/database/schema.ts` — see the corrected `.ai/specs/2026-09-26-payments-module.md` for that correction). A stray debug `console.log` in `app/user/orders/index.tsx`'s render path was also removed.

Three further fixes are proposed below.

## 📝 Problem Statement
- Every multi-item order operation (`addOrderItemsToOrder`, `removeOrderItems`, `updateOrderItemQuantities`, `deleteOrder`) loops sequential single-record writes with no `database.batch()` — the same non-atomic pattern already fixed in `attendance` and `payments`.
- `createOrderSchema`/`createOrderItemSchema` (Zod) are defined but never called — order creation relies only on ad-hoc UI checks (non-empty cart).
- `useOrganizationDashboard`'s "pending orders" count bypasses `OrderRepository` with a raw `database.get("orders")` call inside a `schools`-collection observer, so it only recomputes when the schools list changes, not when an order's own status changes.

## 📝 Proposed Solution
Three independently shippable fixes:

1. **Batch the multi-item operations** — rewrite `addOrderItemsToOrder`, `removeOrderItems`, `updateOrderItemQuantities`, and `deleteOrder` to build one `database.batch()` of prepared operations per call, inside a single `database.write()`. `useOrderDetails.handleUpdateItems`'s three-step sequence (remove → update → add) is collapsed into one batch spanning all three kinds of change, so a save either fully commits or fully fails.
2. **Wire the existing validation schemas in** — call `createOrderSchema`/`createOrderItemSchema` inside `createOrderWithItems` before writing, throwing a clear validation error instead of trusting the caller.
3. **Fix the dashboard's pending-orders reactivity gap** — add an `observeCountBySchoolIds(schoolIds, status)`-style method to `OrderRepository` and have `useOrganizationDashboard` use it directly instead of the raw `database.get("orders")` call nested inside the schools observer. The count now recomputes when an order's own status changes, not just when the schools list changes.

**Confirmed as intentional, not changed by this spec:**
- No status-transition guardrails — moving an order to any status (including backward) is deliberately left to instructor discretion.
- Stock quantity is decorative only — never checked or decremented by placing an order. Confirmed intentional (manual fulfillment process).

## 📝 Architecture
No new modules. Fix #1 and #2 are internal to `orders`' own service layer. Fix #3 adds one method to `OrderRepository` (already the module's own repository, no new cross-module dependency) and changes one line in `organization`'s dashboard hook to call it instead of reaching around the repository — this closes the repository-pattern violation flagged in the `organization`/`school` spec's research, without redesigning anything else about that dashboard.

## 📝 Data Model
No schema changes for the three proposed fixes. (The already-landed schema relocation, described in the TLDR, is a structural move with no column/table changes — see that section for detail.)

## 📝 API Contracts
- `createOrderWithItems` gains a new thrown error case (validation failure) in addition to existing error cases (fix #2).
- `OrderRepository` gains `observeCountBySchoolIds(schoolIds, status)` (fix #3) — additive, no existing method signature changes.
- Fix #1 changes the internal transaction shape of four service functions from N sequential writes to one batch — callers' external contract (`Promise<void>`, thrown-on-failure) is unchanged, only the atomicity guarantee improves.

## 📝 UI/UX
No visible UI changes from any of the three fixes — all are internal correctness/cleanup work.

## 📝 Edge Cases & Failure Scenarios
| Scenario | Current behavior | Behavior after this spec |
|---|---|---|
| Editing an order's items fails partway (remove succeeds, add fails) | Order left in an inconsistent partial state | Fully commits or fully fails as one batch (fix #1) |
| Order created with an invalid/malformed item somehow reaching the service | Silently accepted | Throws a validation error before any write (fix #2) |
| Instructor changes an order's status on the detail screen | Organization dashboard's pending-orders count doesn't update until the schools list itself changes | Updates immediately (fix #3) |
| Instructor moves an order backward (`completed → placed`) | Allowed, no confirmation/restriction | Unchanged — confirmed intentional |
| Order placed for an out-of-stock item | Allowed, no restriction, stock unaffected | Unchanged — confirmed intentional |

## 📝 Risks & Impact Review
- Fixes #1–#3 are low blast radius, no schema change, fully reversible.
- Fix #1's batching change affects `useOrderDetails.handleUpdateItems`, the one call site that sequences all three operation types — regression-test the combined add+remove+update-in-one-save path specifically, not just each operation in isolation.
- The already-landed schema relocation and payments-module duplicate-table correction (see TLDR) required cross-referencing two specs written earlier in this sequence (`organization`/`school`, `payments`) — a reminder that structural/schema-location findings surfaced by one module's spec can retroactively correct an earlier one; both affected specs have been updated to reflect the corrected understanding.

## 📋 Phasing
Each fix ships independently:
- **Fix #1** — Batch the multi-item operations.
- **Fix #2** — Wire existing Zod validation into the write path.
- **Fix #3** — Fix the dashboard's pending-orders reactivity gap.

## 📋 Implementation Plan

1. Rewrite `addOrderItemsToOrder`, `removeOrderItems`, `updateOrderItemQuantities`, `deleteOrder` to build a `database.batch()` of `prepareCreate`/`prepareUpdate` operations inside one `database.write()`; update `useOrderDetails.handleUpdateItems` to build one combined batch across remove+update+add instead of three sequential service calls. Test: inject a failure into one of three combined item changes — assert zero changes committed, not a partial subset.
2. Call `createOrderSchema.parse(...)` inside `createOrderWithItems` before any write. Test: an empty-string `schoolMemberId` or a zero-quantity item throws before any DB write occurs.
3. Add `OrderRepository.observeCountBySchoolIds(schoolIds, status)`; update `useOrganizationDashboard` to subscribe to it directly instead of the nested raw `database.get("orders")` call inside the schools observer. Test: changing an existing order's status (with the schools list unchanged) updates the dashboard's pending-orders count without needing a schools-list change to trigger it.
