import type { CartItem, CreateOrderItemDto } from "../types/dto";

/** Variant picked in Add product (12F): what a cart line needs besides the quantity. */
export type CartVariant = Omit<CartItem, "id" | "quantity">;

/**
 * Sets the quantity of one variant in the cart: updates its line, adds a
 * line (with `newId`) or removes it when the quantity drops to 0.
 */
export const setCartQuantity = (
  cart: CartItem[],
  variant: CartVariant,
  quantity: number,
  newId: () => string,
): CartItem[] => {
  const index = cart.findIndex((item) => item.variantId === variant.variantId);
  if (quantity <= 0) return index === -1 ? cart : cart.filter((_, i) => i !== index);
  if (index === -1) return [...cart, { ...variant, id: newId(), quantity }];
  return cart.map((item, i) => (i === index ? { ...item, quantity } : item));
};

/** Applies every quantity chosen in Add product (variantId → quantity). */
export const applyCartQuantities = (
  cart: CartItem[],
  variants: CartVariant[],
  quantities: Record<string, number>,
  newId: () => string,
): CartItem[] =>
  variants.reduce(
    (acc, variant) =>
      variant.variantId in quantities ? setCartQuantity(acc, variant, quantities[variant.variantId], newId) : acc,
    cart,
  );

export const cartItemCount = (cart: Array<{ quantity: number }>): number =>
  cart.reduce((sum, item) => sum + item.quantity, 0);

export const cartTotals = (cart: Array<{ quantity: number; unitPrice: number; currency: string }>): Record<string, number> =>
  cart.reduce<Record<string, number>>((acc, item) => {
    acc[item.currency] = (acc[item.currency] ?? 0) + item.unitPrice * item.quantity;
    return acc;
  }, {});

export const toOrderItemDto = (item: CartItem): CreateOrderItemDto => ({
  variantId: item.variantId,
  quantity: item.quantity,
  unitPrice: item.unitPrice,
  currency: item.currency,
});

export interface CartDiff {
  itemIdsToRemove: string[];
  itemsToAdd: CreateOrderItemDto[];
  quantityUpdates: Array<{ itemId: string; quantity: number }>;
}

/** What Save (12D) writes: removed lines, new lines and changed quantities. */
export const diffCart = (original: Array<{ id: string; quantity: number }>, cart: CartItem[]): CartDiff => {
  const originalById = new Map(original.map((item) => [item.id, item]));
  const cartIds = new Set(cart.map((item) => item.id));
  return {
    itemIdsToRemove: original.filter((item) => !cartIds.has(item.id)).map((item) => item.id),
    itemsToAdd: cart.filter((item) => !originalById.has(item.id)).map(toOrderItemDto),
    quantityUpdates: cart
      .filter((item) => {
        const before = originalById.get(item.id);
        return before !== undefined && before.quantity !== item.quantity;
      })
      .map((item) => ({ itemId: item.id, quantity: item.quantity })),
  };
};

export const hasCartChanges = (original: Array<{ id: string; quantity: number }>, cart: CartItem[]): boolean => {
  const diff = diffCart(original, cart);
  return diff.itemIdsToRemove.length > 0 || diff.itemsToAdd.length > 0 || diff.quantityUpdates.length > 0;
};
