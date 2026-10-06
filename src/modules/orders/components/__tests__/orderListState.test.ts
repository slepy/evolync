import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildShoppingList,
  countOrdersByStatus,
  countShoppingChips,
  filterOrdersByStatus,
  filterShoppingOrders,
  shoppingListText,
  shoppingVariantsLine,
  type ShoppingListSource,
} from "@/modules/orders/components/orderListState";

const item = (variantId: string, quantity: number, productName = "Gi", variantName = "A2"): ShoppingListSource => ({
  variantId,
  productId: `p-${productName}`,
  productName,
  variantName,
  imageUrl: null,
  quantity,
});

describe("countOrdersByStatus", () => {
  it("counts every status, zero for unused ones", () => {
    const counts = countOrdersByStatus([{ status: "placed" }, { status: "placed" }, { status: "paid" }]);
    assert.deepEqual(counts, { all: 3, placed: 2, paid: 1, processing: 0, ready_for_pickup: 0, completed: 0 });
  });
});

describe("filterOrdersByStatus", () => {
  const orders = [{ id: 1, status: "placed" as const }, { id: 2, status: "paid" as const }];
  it("keeps everything for all", () => {
    assert.equal(filterOrdersByStatus(orders, "all").length, 2);
  });
  it("keeps the chosen status", () => {
    assert.deepEqual(filterOrdersByStatus(orders, "paid").map((o) => o.id), [2]);
  });
});

describe("shopping chips", () => {
  const orders = [
    { id: 1, status: "placed" as const },
    { id: 2, status: "paid" as const },
    { id: 3, status: "processing" as const },
    { id: 4, status: "completed" as const },
  ];
  it("To order covers Placed and Paid", () => {
    assert.deepEqual(filterShoppingOrders(orders, "to_order").map((o) => o.id), [1, 2]);
  });
  it("counts every chip, completed orders in none", () => {
    assert.deepEqual(countShoppingChips(orders), { to_order: 2, processing: 1, ready_for_pickup: 0 });
  });
});

describe("buildShoppingList", () => {
  it("groups sizes under the product and sums quantities", () => {
    const list = buildShoppingList([
      { items: [item("v170", 1, "Gi", "170 cm"), item("v150", 1, "Gi", "150 cm")] },
      { items: [item("v170", 2, "Gi", "170 cm"), item("v1", 3, "Belt", "Standard")] },
    ]);
    assert.deepEqual(
      list.map((p) => [p.productName, p.totalQuantity, shoppingVariantsLine(p)]),
      [
        ["Belt", 3, "Standard ×3"],
        ["Gi", 4, "150 cm ×1 · 170 cm ×3"],
      ],
    );
  });

  it("is empty without orders", () => {
    assert.deepEqual(buildShoppingList([]), []);
  });
});

describe("shoppingListText", () => {
  it("names the size except for Standard", () => {
    const list = buildShoppingList([{ items: [item("v1", 2), item("v2", 1, "Belt", "Standard")] }]);
    assert.equal(shoppingListText(list), "Belt - 1x\nGi (A2) - 2x");
  });
});
