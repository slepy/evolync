import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  LOW_STOCK_THRESHOLD,
  stockStatusOf,
  summarizeProductRow,
} from "@/modules/inventory/components/productRowSummary";

describe("stockStatusOf", () => {
  it("is out at zero", () => {
    assert.equal(stockStatusOf(0), "out");
  });

  it("is low up to the threshold", () => {
    assert.equal(stockStatusOf(1), "low");
    assert.equal(stockStatusOf(LOW_STOCK_THRESHOLD), "low");
  });

  it("is in stock above the threshold", () => {
    assert.equal(stockStatusOf(LOW_STOCK_THRESHOLD + 1), "in");
  });
});

describe("summarizeProductRow", () => {
  it("shows the single variant price without from", () => {
    const s = summarizeProductRow([{ name: "Standard", price: 120, currency: "PLN", stockQuantity: 8 }]);
    assert.deepEqual(s.prices, [{ currency: "PLN", price: 120, from: false }]);
    assert.equal(s.totalStock, 8);
    assert.equal(s.stockStatus, "in");
    assert.equal(s.variantCount, 1);
    assert.deepEqual(s.sizes, []);
  });

  it("takes the lowest price per currency and never blends currencies", () => {
    const s = summarizeProductRow([
      { name: "M", price: 150, currency: "PLN", stockQuantity: 2 },
      { name: "L", price: 120, currency: "PLN", stockQuantity: 1 },
      { name: "XL", price: 30, currency: "EUR", stockQuantity: 0 },
    ]);
    assert.deepEqual(s.prices, [
      { currency: "PLN", price: 120, from: true },
      { currency: "EUR", price: 30, from: true },
    ]);
    assert.equal(s.totalStock, 3);
    assert.equal(s.stockStatus, "low");
    assert.equal(s.variantCount, 3);
    assert.deepEqual(s.sizes, ["M", "L", "XL"]);
  });

  it("is out of stock without variants", () => {
    const s = summarizeProductRow([]);
    assert.deepEqual(s.prices, []);
    assert.equal(s.stockStatus, "out");
  });
});
