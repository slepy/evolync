# Execution Plan: Inventory Module Fixes

Source doc: .ai/specs/2026-09-27-inventory-module.md

## Goal

Finish the three remediation fixes proposed in the inventory-module spec.

## Scope

- Remove unused dead code (`updateStockQuantity`, `deleteImage`).
- Currency-aware aggregate price/stock display on `ProductCard`.
- Delete confirmation warning when order history exists.

## Findings

Repo inspection (on `origin/main`) shows the spec's remediation was already
carried out for two of the three fixes in the same commit that landed the
spec document itself (`2c81b92`):

- Fix #1: `updateStockQuantity` was already removed from `productService.ts`.
  `deleteImage` in `src/modules/core/utils/uploadImage.ts` is still present
  with zero call sites anywhere in `src/` or `app/` — this is the one
  remaining piece of Fix #1.
- Fix #2: `ProductCard.tsx` already groups variants by currency via
  `getSummaryByCurrency` and renders one price/stock line per currency group.
- Fix #3: `OrderItemRepository.countByVariantIds` already exists and is
  already wired into `app/organization/inventory/[productId]/edit.tsx`'s
  `handleDelete`, using the existing `inventoryDeleteProductConfirmWithOrders`
  / `inventoryDeleteProductConfirm` i18n keys (present in both en.json and
  pl.json). No separate variant-level delete UI exists, so no second call
  site is needed.

## Implementation Plan

1. Delete the dead `deleteImage` function (and its JSDoc) from
   `src/modules/core/utils/uploadImage.ts`. Test: typecheck passes with no
   remaining references to `deleteImage`.

## Risks

- Low risk: pure dead-code removal, confirmed zero callers via repo-wide grep.
- No test framework exists in this repository (no `*.test.*` files anywhere),
  so no new automated test is added for this deletion; typecheck is the gate.

## Progress

PR: #8

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Remove dead code

- [x] 1.1 Delete unused `deleteImage` function from uploadImage.ts — 32c3efc
