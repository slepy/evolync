# Payments Module — Specification (as-built + remediation)

## 📝 TLDR
Documents current behavior of `src/modules/payments/` — manually created billing "cycles" (arbitrary date ranges) with a `payment_records` row per active member, marked paid/pending/cancelled by the instructor. No online payment processing exists (manual only, per CLAUDE.md). **Correction from an earlier pass of this spec:** `payment_cycles`/`payment_records` were initially believed to be missing from the WatermelonDB bootstrap schema entirely. Closer investigation (triggered while writing the `orders` module spec, which shares the same module-boundary drift) showed the tables were **not actually missing** — they were already registered in the bootstrap schema, but defined in the wrong place (`organization/database/schema.ts`, the same structural drift already flagged in the `organization`/`school` spec). A properly-located `src/modules/payments/database/schema.ts` has now been created and registered, and the stale duplicate definitions have been removed from `organization/database/schema.ts` — this was a structural cleanup (fixing a real duplicate-table defect the first pass introduced), not a fresh-install-breaking bug as originally reported. Three further fixes are proposed: remove unused dead code instead of building UI for it, make bulk saves atomic (mirroring the `attendance` module's fix), and add validation with school-sourced currency defaults everywhere.

## 📝 Problem Statement
- Several service functions have zero call sites anywhere in the app (`getPaymentCycleById`, `getPaymentCyclesForSchool`, `updatePaymentCycle`, `deletePaymentCycle` — wired to a hook method but never invoked by any screen —, `markPaymentAsPaid`, `bulkCreatePaymentRecords`). None of these represent a maintained, reachable feature.
- `bulkSavePaymentList`/`bulkUpdatePaymentRecords` loop sequential single-record writes with no `database.batch()` and no partial-failure handling — the same pattern already fixed for `attendance`.
- No validation layer exists (`validation/` is empty) — amount, currency, status, method reach the DB unvalidated at runtime.
- Currency defaults to a hardcoded `"PLN"` in three places (`PaymentRecordRepository.bulkCreate`'s default parameter, `markPaymentAsPaid`'s create-defaults, the cycle-list screen's stats fallback), instead of the school's configured `default_currency`.

## 📝 Proposed Solution
Three independently shippable fixes:

1. **Remove unreachable dead code** — delete `getPaymentCycleById`, `getPaymentCyclesForSchool`, `updatePaymentCycle`, `deletePaymentCycle`, `markPaymentAsPaid`, `bulkCreatePaymentRecords` from `paymentService.ts` and their barrel exports; remove the corresponding unused `deleteCycle` wrapper from `usePaymentCycles`. No UI is built for cycle deletion or single-payment marking — if that capability is wanted later, it gets designed fresh in its own spec rather than resurrecting orphaned code that was never wired up or tested end-to-end.
2. **Batch the bulk-save functions** — rewrite `bulkSavePaymentList` and `bulkUpdatePaymentRecords` to build one `database.batch()` of `prepareUpdate`/`prepareCreate` operations inside a single `database.write()`, mirroring `PaymentRecordRepository.bulkCreate`'s existing correct pattern (and the same fix already specified for `attendance`). Either fully commits or fully fails — no partial-state gap.
3. **Add validation + school-sourced currency everywhere** — add Zod schemas for `CreatePaymentCycleDto` (period dates, notes length) and `UpsertPaymentRecordDto`/record edits (`amount >= 0`, `status`/`method` enums, non-empty `currency`), called before every write. Remove the hardcoded `"PLN"` default parameter from `PaymentRecordRepository.bulkCreate` (make `currency`/`amount` required arguments — forces every caller to explicitly source them, e.g. from `SchoolSettings`, rather than silently falling back); change the cycle-list screen's zero-records stats fallback to read the school's `default_currency` instead of a hardcoded `"PLN"`.

## 📝 Architecture
No new modules. Fix #1 shrinks the service's public surface to only what's actually reachable from the UI. Fix #3's `bulkCreate` signature change affects its one real caller (`createPaymentCycle`, already passing explicit values sourced from `SchoolSettings` per existing code) and the students module's Fix #1 (payment-cycle enrollment during join-request approval, already specced to read `SchoolSettings` too) — both callers already pass explicit values today, so removing the default parameter is a pure safety net with no behavior change for current callers.

## 📝 Data Model
No schema changes beyond the already-landed critical fix (bootstrap schema registration).

## 📝 API Contracts
- `PaymentRecordRepository.bulkCreate(cycleId, memberIds, amount, currency)` — `amount`/`currency` become required (previously had defaults `0`/`"PLN"`). Both existing callers already pass explicit values; no call-site change needed, just removal of the now-unused default.
- `createPaymentCycle`/`upsertPaymentRecord`/bulk functions throw a new validation-error case before any write, in addition to existing error cases.
- Removed (Fix #1): `getPaymentCycleById`, `getPaymentCyclesForSchool`, `updatePaymentCycle`, `deletePaymentCycle`, `markPaymentAsPaid`, `bulkCreatePaymentRecords` — confirmed zero call sites before removal.

## 📝 UI/UX
No visible UI changes from any of the three fixes — all are internal correctness/cleanup work. (No cycle-deletion UI is added — see Proposed Solution #1.)

## 📝 Edge Cases & Failure Scenarios
| Scenario | Current behavior | Behavior after this spec |
|---|---|---|
| Bulk payment save fails partway through | Some records updated, some not, no rollback, no clear error | Batch fully commits or fully fails (fix #2) |
| Instructor creates a cycle with an invalid amount/currency somehow reaching the service | Silently accepted, only caught by Supabase check constraint at sync time | Throws a validation error before any local write (fix #3) |
| School with non-PLN `default_currency` gets a payment record via any `bulkCreate` caller | Falls back to PLN unless caller explicitly overrides | No default exists — every caller must pass the school's actual currency (fix #3) |
| Cycle list screen renders stats for a cycle with zero records | Shows "PLN" regardless of school's actual currency | Shows the school's configured `default_currency` (fix #3) |
| Instructor calls `deletePaymentCycle` / `markPaymentAsPaid` | Function exists but nothing in the app calls it | Removed — not a regression, since nothing used it |

## 📝 Risks & Impact Review
- **Fix #1 is a deletion** — confirm zero call sites (already verified via the research pass: grep found no references outside each function's own definition/export) before removing; low risk given that verification, fully recoverable via version control if something was missed.
- **Fix #3's `bulkCreate` signature change** is a breaking internal API change (removing default parameters) — both current callers already pass explicit values, so this is a safety-net change with no runtime behavior difference today, but any future caller must now supply currency/amount explicitly.
- Fixes #2–#3 are low blast radius, no schema change, fully reversible.
- The already-landed schema relocation (payments' own `schema.ts` created, duplicate removed from `organization`) is a pure structural move — the table definitions themselves are unchanged, so there is no data-migration risk; it corrects the module-boundary drift and the duplicate-table defect the first pass of this fix introduced, without changing runtime behavior for any existing install.
- **No cross-cycle "who owes money" report** (Q6) remains an intentional non-goal for now, not designed in this pass.

## 📋 Phasing
Each fix ships independently:
- **Fix #1** — Remove unreachable dead code.
- **Fix #2** — Batch bulk-save functions.
- **Fix #3** — Validation + school-sourced currency defaults everywhere.

## 📋 Implementation Plan

1. Delete `getPaymentCycleById`, `getPaymentCyclesForSchool`, `updatePaymentCycle`, `deletePaymentCycle`, `markPaymentAsPaid`, `bulkCreatePaymentRecords` from `paymentService.ts` and their exports from `services/index.ts`/the module barrel; remove `usePaymentCycles`'s now-orphaned `deleteCycle` wrapper. Test: typecheck passes with no remaining imports of the removed symbols anywhere in the app.
2. Rewrite `bulkSavePaymentList`/`bulkUpdatePaymentRecords` to build a `database.batch()` of prepared operations inside one `database.write()`. Test: inject a failure partway through a multi-record save — assert zero records changed, not a partial subset.
3. Add Zod schemas (`createPaymentCycleSchema`, `paymentRecordEditSchema`) in the now-populated `validation/` directory; call them inside `createPaymentCycle` and `upsertPaymentRecord`/each bulk function's per-item edit before writing. Test: an invalid amount (negative) or empty currency throws before any DB write.
4. Remove the default parameters from `PaymentRecordRepository.bulkCreate`'s signature (`amount`, `currency` become required); update both call sites (`createPaymentCycle`, students module's join-approval flow) to confirm they already pass explicit values — no behavior change expected, this is a compile-time safety net. Test: typecheck fails if any caller omits the now-required arguments (regression guard for future callers).
5. Change the cycle-list screen's zero-records stats fallback from `cycleRecords[0]?.currency || "PLN"` to read the school's `SchoolSettings.default_currency`. Test: a school with `default_currency: "USD"` shows "USD" in the stats for a newly created cycle with no records yet.
