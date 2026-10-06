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

/** Translation keys (label, 12C hint) and chip color of every status. */
export const ORDER_STATUS_STYLE: Record<OrderStatus, { label: string; hint: string; accent: ModuleKey | "neutral" }> = {
  placed: { label: "statusPlaced", hint: "ordersStatusHintPlaced", accent: "neutral" },
  paid: { label: "statusPaid", hint: "ordersStatusHintPaid", accent: "payments" },
  processing: { label: "statusProcessing", hint: "ordersStatusHintProcessing", accent: "events" },
  ready_for_pickup: { label: "statusReadyForPickup", hint: "ordersStatusHintReady", accent: "orders" },
  completed: { label: "statusCompleted", hint: "ordersStatusHintCompleted", accent: "trainings" },
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

export interface ShoppingListVariant {
  variantId: string;
  variantName: string;
  quantity: number;
}

/** One product of the shopping list (12B): its sizes with quantities and the total. */
export interface ShoppingListProduct {
  productId: string;
  productName: string;
  imageUrl: string | null;
  totalQuantity: number;
  variants: ShoppingListVariant[];
}

/** Chips of the shopping list: what still has to be bought, then the orders in progress. */
export type ShoppingChip = "to_order" | typeof OrderStatus.PROCESSING | typeof OrderStatus.READY_FOR_PICKUP;

export const SHOPPING_CHIPS: ShoppingChip[] = ["to_order", OrderStatus.PROCESSING, OrderStatus.READY_FOR_PICKUP];

/** "To order" covers the orders nobody has bought yet. */
export const TO_ORDER_STATUSES: OrderStatus[] = [OrderStatus.PLACED, OrderStatus.PAID];

const chipStatuses = (chip: ShoppingChip): OrderStatus[] => (chip === "to_order" ? TO_ORDER_STATUSES : [chip]);

export const filterShoppingOrders = <T extends { status: OrderStatus }>(orders: T[], chip: ShoppingChip): T[] =>
  orders.filter((o) => chipStatuses(chip).includes(o.status));

export const countShoppingChips = (orders: Array<{ status: OrderStatus }>): Record<ShoppingChip, number> => {
  const counts = {} as Record<ShoppingChip, number>;
  for (const chip of SHOPPING_CHIPS) counts[chip] = filterShoppingOrders(orders, chip).length;
  return counts;
};

const byName = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true });

/** Sums the ordered items per product and size, products and sizes sorted by name. */
export const buildShoppingList = (orders: Array<{ items: ShoppingListSource[] }>): ShoppingListProduct[] => {
  const byProduct = new Map<string, ShoppingListProduct>();
  for (const order of orders) {
    for (const item of order.items) {
      let product = byProduct.get(item.productId);
      if (!product) {
        product = {
          productId: item.productId,
          productName: item.productName,
          imageUrl: item.imageUrl,
          totalQuantity: 0,
          variants: [],
        };
        byProduct.set(item.productId, product);
      }
      product.totalQuantity += item.quantity;
      const variant = product.variants.find((v) => v.variantId === item.variantId);
      if (variant) variant.quantity += item.quantity;
      else product.variants.push({ variantId: item.variantId, variantName: item.variantName, quantity: item.quantity });
    }
  }
  const products = [...byProduct.values()];
  for (const product of products) product.variants.sort((a, b) => byName(a.variantName, b.variantName));
  return products.sort((a, b) => byName(a.productName, b.productName));
};

/** Row subtitle: "150 cm ×1 · 160 cm ×2". */
export const shoppingVariantsLine = (product: ShoppingListProduct): string =>
  product.variants.map((v) => `${v.variantName} ×${v.quantity}`).join(" · ");

/** The "Standard" variant of a single-size product is not named. */
export const isStandardVariant = (variantName: string): boolean => variantName.trim().toLowerCase() === "standard";

/** Copy text: one "Product (size) - 3x" line per size. */
export const shoppingListText = (products: ShoppingListProduct[]): string =>
  products
    .flatMap((product) =>
      product.variants.map((v) => {
        const size = isStandardVariant(v.variantName) ? "" : ` (${v.variantName})`;
        return `${product.productName}${size} - ${v.quantity}x`;
      }),
    )
    .join("\n");
