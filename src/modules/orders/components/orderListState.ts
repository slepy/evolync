import { orderStatusColors } from "@/core/theme/tokens";
import { OrderStatus } from "../types/enums";

/** Status order of the chips (12A) and the status sheet (12C). */
export const ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.PLACED,
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.READY_FOR_PICKUP,
  OrderStatus.COMPLETED,
];

/** Translation keys and colors of every status: chip / pill label, sheet title and hint (12C). */
export const ORDER_STATUS_STYLE: Record<
  OrderStatus,
  { label: string; title: string; hint: string; tint: string; fill: string }
> = {
  placed: { label: "statusPlaced", title: "statusPlaced", hint: "ordersStatusHintPlaced", ...orderStatusColors.placed },
  paid: { label: "statusPaid", title: "statusPaid", hint: "ordersStatusHintPaid", ...orderStatusColors.paid },
  processing: {
    label: "statusProcessing",
    title: "statusProcessing",
    hint: "ordersStatusHintProcessing",
    ...orderStatusColors.processing,
  },
  ready_for_pickup: {
    label: "ordersStatusReady",
    title: "statusReadyForPickup",
    hint: "ordersStatusHintReady",
    ...orderStatusColors.ready_for_pickup,
  },
  completed: {
    label: "statusCompleted",
    title: "statusCompleted",
    hint: "ordersStatusHintCompleted",
    ...orderStatusColors.completed,
  },
};

// ============================================================================
// Orders list filter (12A): Open = everything not completed, then each status
// ============================================================================

export type OrderFilter = "open" | OrderStatus;

export const ORDER_FILTERS: OrderFilter[] = ["open", ...ORDER_STATUSES];

export const matchesOrderFilter = (status: OrderStatus, filter: OrderFilter): boolean =>
  filter === "open" ? status !== OrderStatus.COMPLETED : status === filter;

export const countByFilter = <F extends string>(
  orders: Array<{ status: OrderStatus }>,
  filters: readonly F[],
  matches: (status: OrderStatus, filter: F) => boolean,
): Record<F, number> =>
  Object.fromEntries(filters.map((f) => [f, orders.filter((o) => matches(o.status, f)).length])) as Record<F, number>;

// ============================================================================
// Shopping list filter (12B): To order = placed + paid, then processing, ready
// ============================================================================

export type ShoppingFilter = "toOrder" | typeof OrderStatus.PROCESSING | typeof OrderStatus.READY_FOR_PICKUP;

export const SHOPPING_FILTERS: ShoppingFilter[] = ["toOrder", OrderStatus.PROCESSING, OrderStatus.READY_FOR_PICKUP];

export const matchesShoppingFilter = (status: OrderStatus, filter: ShoppingFilter): boolean =>
  filter === "toOrder" ? status === OrderStatus.PLACED || status === OrderStatus.PAID : status === filter;

// ============================================================================
// Shopping list (12B): one row per product, sizes with their quantities
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
  productId: string;
  productName: string;
  imageUrl: string | null;
  /** Sizes in the order they were first seen, with summed quantities. */
  sizes: Array<{ variantId: string; name: string; quantity: number }>;
  totalQuantity: number;
}

/** Sums the ordered items per product and size, sorted by product name. */
export const buildShoppingList = (orders: Array<{ items: ShoppingListSource[] }>): ShoppingListItem[] => {
  const byProduct = new Map<string, ShoppingListItem>();
  for (const order of orders) {
    for (const item of order.items) {
      const key = item.productId || item.variantId;
      let product = byProduct.get(key);
      if (!product) {
        product = { productId: key, productName: item.productName, imageUrl: item.imageUrl, sizes: [], totalQuantity: 0 };
        byProduct.set(key, product);
      }
      const size = product.sizes.find((s) => s.variantId === item.variantId);
      if (size) size.quantity += item.quantity;
      else product.sizes.push({ variantId: item.variantId, name: item.variantName, quantity: item.quantity });
      product.totalQuantity += item.quantity;
    }
  }
  return [...byProduct.values()].sort((a, b) => a.productName.localeCompare(b.productName));
};

/** Pieces in the orders (shopping list header). */
export const totalPieces = (orders: Array<{ items: Array<{ quantity: number }> }>): number =>
  orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);

/** The "Standard" variant of a single-size product. */
export const isStandardVariant = (variantName: string): boolean => variantName.trim().toLowerCase() === "standard";

/** "150 cm ×1 · 160 cm ×2" (12B row hint). */
export const sizesLine = (item: ShoppingListItem): string =>
  item.sizes.map((s) => `${s.name} ×${s.quantity}`).join(" · ");

/** Copy text: one "Product: 150 cm ×1, 160 cm ×2 (3)" line per product. */
export const shoppingListText = (items: ShoppingListItem[]): string =>
  items
    .map((item) => {
      const sizes = item.sizes.length === 1 && isStandardVariant(item.sizes[0].name)
        ? `×${item.totalQuantity}`
        : `${item.sizes.map((s) => `${s.name} ×${s.quantity}`).join(", ")} (${item.totalQuantity})`;
      return `${item.productName}: ${sizes}`;
    })
    .join("\n");

// ============================================================================
// Amounts: "1 385 PLN", one line per currency
// ============================================================================

const CURRENCY_ORDER = ["PLN", "EUR", "USD"];

/** "1 385 PLN" / "89.50 PLN" — space thousands, decimals only when needed. */
export const formatAmount = (amount: number, currency: string): string => {
  const rounded = Math.round(amount * 100) / 100;
  const [whole, fraction] = (Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2)).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${fraction ? `${grouped}.${fraction}` : grouped} ${currency}`;
};

/** One formatted amount per currency, PLN / EUR / USD first. */
export const amountLines = (totals: Record<string, number>): string[] =>
  Object.keys(totals)
    .filter((c) => totals[c] !== 0)
    .sort((a, b) => {
      const ia = CURRENCY_ORDER.indexOf(a);
      const ib = CURRENCY_ORDER.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b);
    })
    .map((c) => formatAmount(totals[c], c));
