import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ORDER_FILTERS,
  SHOPPING_FILTERS,
  amountLines,
  buildShoppingList,
  countByFilter,
  formatAmount,
  matchesOrderFilter,
  matchesShoppingFilter,
  shoppingListText,
  sizesLine,
  totalPieces,
  type ShoppingListSource,
} from "@/modules/orders/components/orderListState";

const item = (variantId: string, quantity: number, productName = "Gi", variantName = "160 cm"): ShoppingListSource => ({
  variantId,
  productId: `p-${productName}`,
  productName,
  variantName,
  imageUrl: null,
  quantity,
});

describe("order filters (12A)", () => {
  const orders = [{ status: "placed" as const }, { status: "paid" as const }, { status: "completed" as const }];

  it("Open is everything but completed", () => {
    assert.equal(matchesOrderFilter("processing", "open"), true);
    assert.equal(matchesOrderFilter("completed", "open"), false);
  });

  it("counts every chip", () => {
    assert.deepEqual(countByFilter(orders, ORDER_FILTERS, matchesOrderFilter), {
      open: 2,
      placed: 1,
      paid: 1,
      processing: 0,
      ready_for_pickup: 0,
      completed: 1,
    });
  });
});

describe("shopping filters (12B)", () => {
  it("To order is placed and paid", () => {
    assert.equal(matchesShoppingFilter("placed", "toOrder"), true);
    assert.equal(matchesShoppingFilter("paid", "toOrder"), true);
    assert.equal(matchesShoppingFilter("processing", "toOrder"), false);
    assert.equal(matchesShoppingFilter("processing", "processing"), true);
    assert.deepEqual(SHOPPING_FILTERS, ["toOrder", "processing", "ready_for_pickup"]);
  });
});

describe("buildShoppingList", () => {
  it("groups by product with summed sizes", () => {
    const list = buildShoppingList([
      { items: [item("v150", 1, "Gi", "150 cm"), item("v160", 1)] },
      { items: [item("v160", 1), item("m", 2, "Gloves", "M")] },
    ]);
    assert.deepEqual(
      list.map((p) => [p.productName, p.totalQuantity, sizesLine(p)]),
      [
        ["Gi", 3, "150 cm ×1 · 160 cm ×2"],
        ["Gloves", 2, "M ×2"],
      ],
    );
  });

  it("counts pieces of the orders", () => {
    assert.equal(totalPieces([{ items: [item("a", 2), item("b", 1)] }, { items: [item("c", 4)] }]), 7);
  });
});

describe("shoppingListText", () => {
  it("lists sizes per product, Standard as a plain count", () => {
    const list = buildShoppingList([{ items: [item("v1", 2), item("t", 3, "T-shirt", "Standard")] }]);
    assert.equal(shoppingListText(list), "Gi: 160 cm ×2 (2)\nT-shirt: ×3");
  });
});

describe("amounts", () => {
  it("groups thousands with a space and keeps decimals only when needed", () => {
    assert.equal(formatAmount(1385, "PLN"), "1 385 PLN");
    assert.equal(formatAmount(89.5, "PLN"), "89.50 PLN");
    assert.equal(formatAmount(45, "EUR"), "45 EUR");
  });

  it("lists PLN, EUR, USD first and drops zero totals", () => {
    assert.deepEqual(amountLines({ USD: 40, GBP: 5, PLN: 240, EUR: 0 }), ["240 PLN", "40 USD", "5 GBP"]);
  });
});
