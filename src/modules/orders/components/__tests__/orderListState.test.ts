import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildShoppingList,
  countOrdersByStatus,
  filterOrdersByStatus,
  shoppingListText,
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

describe("buildShoppingList", () => {
  it("sums quantities per variant and counts orders once", () => {
    const list = buildShoppingList([
      { items: [item("v1", 2), item("v1", 1)] },
      { items: [item("v1", 3), item("v2", 1, "Belt", "Standard")] },
    ]);
    assert.deepEqual(
      list.map((l) => [l.variantId, l.totalQuantity, l.orderCount]),
      [
        ["v2", 1, 1],
        ["v1", 6, 2],
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
