import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applyCartQuantities,
  cartItemCount,
  cartTotals,
  diffCart,
  hasCartChanges,
  setCartQuantity,
  type CartVariant,
} from "@/modules/orders/components/orderCart";
import type { CartItem } from "@/modules/orders/types/dto";

const variant = (variantId: string, unitPrice = 100, currency = "PLN"): CartVariant => ({
  variantId,
  variantName: variantId.toUpperCase(),
  productId: "p1",
  productName: "Gi",
  unitPrice,
  currency,
});

const line = (id: string, variantId: string, quantity: number): CartItem => ({ ...variant(variantId), id, quantity });

let seq = 0;
const newId = () => `new-${++seq}`;

describe("setCartQuantity", () => {
  it("adds a line for a new variant", () => {
    const cart = setCartQuantity([], variant("a2"), 2, () => "n1");
    assert.deepEqual(cart.map((c) => [c.id, c.variantId, c.quantity]), [["n1", "a2", 2]]);
  });

  it("updates the quantity of an existing line and keeps its id", () => {
    const cart = setCartQuantity([line("x", "a2", 1)], variant("a2"), 3, newId);
    assert.deepEqual(cart.map((c) => [c.id, c.quantity]), [["x", 3]]);
  });

  it("removes the line at 0 and ignores 0 for a missing variant", () => {
    assert.deepEqual(setCartQuantity([line("x", "a2", 1)], variant("a2"), 0, newId), []);
    const cart = [line("x", "a2", 1)];
    assert.equal(setCartQuantity(cart, variant("a3"), 0, newId), cart);
  });
});

describe("applyCartQuantities", () => {
  it("applies only the variants with a chosen quantity", () => {
    const cart = applyCartQuantities([line("x", "a2", 1)], [variant("a2"), variant("a3")], { a3: 2 }, () => "n");
    assert.deepEqual(cart.map((c) => [c.variantId, c.quantity]), [["a2", 1], ["a3", 2]]);
  });
});

describe("cart totals", () => {
  it("counts pieces and sums per currency", () => {
    const cart = [line("x", "a2", 2), { ...line("y", "a3", 1), unitPrice: 30, currency: "EUR" }];
    assert.equal(cartItemCount(cart), 3);
    assert.deepEqual(cartTotals(cart), { PLN: 200, EUR: 30 });
  });
});

describe("diffCart", () => {
  const original = [{ id: "x", quantity: 1 }, { id: "y", quantity: 2 }];

  it("finds removed, added and changed lines", () => {
    const cart = [line("x", "a2", 3), line("n1", "a4", 1)];
    assert.deepEqual(diffCart(original, cart), {
      itemIdsToRemove: ["y"],
      itemsToAdd: [{ variantId: "a4", quantity: 1, unitPrice: 100, currency: "PLN" }],
      quantityUpdates: [{ itemId: "x", quantity: 3 }],
    });
  });

  it("reports no change for the same cart", () => {
    assert.equal(hasCartChanges(original, [line("x", "a2", 1), line("y", "a3", 2)]), false);
    assert.equal(hasCartChanges(original, [line("x", "a2", 1)]), true);
  });
});
