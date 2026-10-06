import type { ModuleKey } from "@/core/theme/tokens";
import { OrderStatus } from "../types/enums";

/** Status order of the chips (12A) and the status sheet (12C). */
export const ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.PLACED,
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.READY_FOR_PICKUP,
  OrderStatus.COMPLETED,
];

export type OrderStatusChip = OrderStatus | "all";

/** Translation key and chip color of every status. */
export const ORDER_STATUS_STYLE: Record<OrderStatus, { label: string; accent: ModuleKey | "neutral" }> = {
  placed: { label: "statusPlaced", accent: "neutral" },
  paid: { label: "statusPaid", accent: "payments" },
  processing: { label: "statusProcessing", accent: "events" },
  ready_for_pickup: { label: "statusReadyForPickup", accent: "orders" },
  completed: { label: "statusCompleted", accent: "trainings" },
};

/** Counts for the status chips: every status plus "all". */
export const countOrdersByStatus = (orders: Array<{ status: OrderStatus }>): Record<OrderStatusChip, number> => {
  const counts = { all: orders.length } as Record<OrderStatusChip, number>;
  for (const status of ORDER_STATUSES) counts[status] = 0;
  for (const order of orders) {
    if (order.status in counts) counts[order.status] += 1;
  }
  return counts;
};

export const filterOrdersByStatus = <T extends { status: OrderStatus }>(orders: T[], chip: OrderStatusChip): T[] =>
  chip === "all" ? orders : orders.filter((o) => o.status === chip);

// ============================================================================
// Shopping list (12B)
// ============================================================================

export interface ShoppingListSource {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  imageUrl: string | null;
  quantity: number;
}

export interface ShoppingListItem {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  imageUrl: string | null;
  totalQuantity: number;
  /** Orders the variant appears in. */
  orderCount: number;
}

/** Sums the ordered items per variant, sorted by product then variant name. */
export const buildShoppingList = (orders: Array<{ items: ShoppingListSource[] }>): ShoppingListItem[] => {
  const byVariant = new Map<string, ShoppingListItem>();
  for (const order of orders) {
    const seen = new Set<string>();
    for (const item of order.items) {
      const existing = byVariant.get(item.variantId);
      if (existing) {
        existing.totalQuantity += item.quantity;
        if (!seen.has(item.variantId)) existing.orderCount += 1;
      } else {
        byVariant.set(item.variantId, {
          variantId: item.variantId,
          productId: item.productId,
          productName: item.productName,
          variantName: item.variantName,
          imageUrl: item.imageUrl,
          totalQuantity: item.quantity,
          orderCount: 1,
        });
      }
      seen.add(item.variantId);
    }
  }
  return [...byVariant.values()].sort(
    (a, b) => a.productName.localeCompare(b.productName) || a.variantName.localeCompare(b.variantName),
  );
};

/** The "Standard" variant of a single-size product is not named. */
export const isStandardVariant = (variantName: string): boolean => variantName.trim().toLowerCase() === "standard";

/** Copy text: one "Product (size) - 3x" line per variant. */
export const shoppingListText = (items: ShoppingListItem[]): string =>
  items
    .map((item) => {
      const size = isStandardVariant(item.variantName) ? "" : ` (${item.variantName})`;
      return `${item.productName}${size} - ${item.totalQuantity}x`;
    })
    .join("\n");
