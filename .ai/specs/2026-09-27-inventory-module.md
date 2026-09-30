# Inventory Module — Specification (as-built + remediation)

> **Status (2026-09-30):** All three fixes are implemented. Verified by direct code inspection: fixes #2 (currency-aware `ProductCard.getSummaryByCurrency`) and #3 (`OrderItemRepository.countByVariantIds` wired into `app/organization/inventory/[productId]/edit.tsx`'s `handleDelete`, with the `inventoryDeleteProductConfirmWithOrders`/`inventoryDeleteProductConfirm` i18n keys in both `en.json` and `pl.json`) were already live on `main` before this pass began. Fix #1's `updateStockQuantity` removal was also already on `main`; its `deleteImage` half (`src/modules/core/utils/uploadImage.ts`) shipped via PR #8, confirmed zero call sites in `src/` and `app/` both before and after removal. The already-landed `product_variants` migration fix predates this pass.

## 📝 TLDR
Documents current behavior of `src/modules/inventory/` — the instructor-owned product catalog (products with one or more variants, each carrying its own price/currency/stock). Student-facing browsing/ordering UI lives entirely in the `orders` module, reusing inventory's repositories directly. A latent migration gap for `product_variants` was confirmed and fixed during this pass (see below). Three further fixes are proposed: remove dead code instead of finishing half-built features, make aggregate price/stock displays currency-aware instead of assuming a single currency, and add a delete confirmation warning when a product/variant has order history.

## 📝 Problem Statement
- **Confirmed and fixed**: `product_variants` had no `createTable` migration step in `src/database/migrations.ts`, despite being introduced after `products` (Postgres history confirms `products` shipped in `init_schema`, `product_variants` was added 8 days later in a separate migration) — the same class of defect already found in `orders`. Any device that installed the app before `product_variants` existed and later auto-updates would never receive that table. A migration step has been added (folded into the existing `toVersion: 17` block, matching the pattern already used for `orders`/`order_items`).
- `updateStockQuantity` (a correctly-guarded manual stock-adjustment function) and `deleteImage` (Supabase Storage cleanup) are both fully implemented but have zero call sites anywhere in the app — half-built features that were never wired to any UI.
- `ProductCard`'s aggregate display (`getLowestPrice`, `getTotalStock`) sums/compares numeric values across a product's variants with no currency grouping, which would produce a numerically meaningless result if a product's variants ever used different currencies — confirmed as a real (if currently rare) scenario, not to be prevented by force but must be displayed correctly.
- Deleting a product or variant with existing order history is allowed with no warning — safe under the hood (orders resolve historical names via `includeDeleted=true` lookups, and `OrderItem` snapshots price/currency), but no confirmation surfaces the fact that orders reference it.

## 📝 Proposed Solution
Three independently shippable fixes (the migration fix above has already landed):

1. **Remove unused dead code** — delete `updateStockQuantity` from `productService.ts` and `deleteImage` from `uploadImage.ts` (plus their exports), confirmed zero call sites. If manual restock or image-cleanup-on-delete are wanted later, they get designed and wired up fresh in their own pass rather than resurrecting orphaned, never-integration-tested code.
2. **Make aggregate displays currency-aware** — `ProductCard.getLowestPrice`/`getTotalStock` group variants by currency first, then compute per-currency lowest-price/total-stock, rendering one line per currency (e.g. "from 50 PLN · from $20") instead of a single blended number. No currency enforcement is added — multiple currencies per product remain fully allowed, as decided; only the display is corrected to handle that case truthfully instead of assuming uniformity.
3. **Add a delete confirmation warning when order history exists** — before soft-deleting a product or variant, check whether any non-deleted `order_items` reference it (via `OrderItemRepository`); if so, show a confirmation dialog naming the order count before proceeding. Deletion itself is unchanged (still allowed, still safe per the existing `includeDeleted` lookups) — this only makes the consequence visible to the instructor before they confirm.

## 📝 Architecture
No new modules. Fix #3 adds one repository query (`OrderItemRepository.countByProductVariantId` or similar) called from `inventory`'s delete flow — a new but shallow cross-module read (inventory reading an orders-owned repository), mirroring the existing pattern of orders reading inventory's repositories in the other direction.

## 📝 Data Model
No schema changes beyond the already-landed migration fix (structural only, no column changes — see Problem Statement).

## 📝 API Contracts
- Removed (fix #1): `updateStockQuantity` (`productService.ts`), `deleteImage` (`uploadImage.ts`) — confirmed zero call sites before removal.
- `deleteProduct`/`deleteProductVariant` gain a preceding check (fix #3) that doesn't change their own signatures — the confirmation happens in the calling UI layer, informed by a new read-only repository query.

## 📝 UI/UX
- Fix #1: no visible UI change (removing unreferenced code).
- Fix #2: `ProductCard`'s price/stock line changes from a single blended figure to one line per currency present among the product's variants — only visible when a product actually has mixed-currency variants; unchanged for the common single-currency case.
- Fix #3: deleting a product/variant that has order history now shows a confirmation dialog stating how many orders reference it, before the existing delete action proceeds.

## 📝 Edge Cases & Failure Scenarios
| Scenario | Current behavior | Behavior after this spec |
|---|---|---|
| Product with variants in two different currencies | `ProductCard` shows one misleading blended "from X" figure and a meaningless summed stock count | Shows one line per currency (fix #2) |
| Instructor deletes a product referenced by 5 existing orders | Deleted silently, no warning | Confirmation dialog states "referenced by 5 orders" before deleting (fix #3) |
| Instructor deletes a product with zero order history | Deleted silently | Unchanged — no dialog needed when there's nothing to warn about |
| A device on a pre-`product_variants` local schema version auto-updates | Would never receive the `product_variants` table, `product_variants` queries would fail | Migration step creates the table on upgrade (already fixed) |

## 📝 Risks & Impact Review
- The already-landed migration fix is additive (new `createTable` step) with no column changes — low risk, matches the pattern already validated for `orders`/`order_items` in the prior spec.
- Fix #1 is a deletion — both functions were verified to have zero external callers before removal; recoverable via version control if something was missed.
- Fix #2 is display-only, no data model or behavior change to how products/variants are actually stored or ordered.
- Fix #3 adds a read (order-count check) before an existing delete action — no change to delete's own effect, low risk, fully reversible (remove the check to revert to today's silent-delete behavior).
- `.ai/inventory/api-plan.md` describes a generic HTTP-API/uploads architecture that does not match the actual offline-first/direct-Storage implementation — flagged here as a stale planning artifact, not treated as ground truth for this spec.

## 📋 Phasing
Each fix ships independently:
- **Fix #1** — Remove unused dead code (`updateStockQuantity`, `deleteImage`). *Status: ✅ implemented (`updateStockQuantity` predates this pass, `deleteImage` via PR #8).*
- **Fix #2** — Currency-aware aggregate price/stock display. *Status: ✅ implemented, on `main`.*
- **Fix #3** — Delete confirmation warning when order history exists. *Status: ✅ implemented, on `main`.*

## 📋 Implementation Plan (already executed)

1. Deleted `updateStockQuantity` from `productService.ts` (predates this pass) and `deleteImage` from `uploadImage.ts` (PR #8), and their barrel exports. Test: typecheck passes with no remaining references to either symbol.
2. Rewrote `ProductCard.getLowestPrice`/`getTotalStock` (now `getSummaryByCurrency`) to group `product.variants` by `currency` first, then compute lowest-price and total-stock per currency group; renders one line per currency in the card. Test: a product with variants in `PLN` and `USD` shows two separate price/stock lines instead of one blended figure; a single-currency product's display is unchanged.
3. Added `OrderItemRepository.countByVariantIds` to count non-deleted order items referencing a given `product_variant_id`; called from the product delete flow in `app/organization/inventory/[productId]/edit.tsx`'s `handleDelete` before showing the existing `confirmDelete` dialog, appending the order count to the confirmation message when greater than zero. No separate variant-level delete UI exists, so no second call site was needed. Test: deleting a product with existing orders shows the order count in the confirmation; deleting one with none shows the existing dialog unchanged.

Verification: `npm run typecheck` shows no errors in any touched file (`inventory/*`, `core/utils/uploadImage.ts`) — remaining typecheck output is pre-existing, unrelated errors in other modules (63 errors, identical count before and after the PR #8 diff).
