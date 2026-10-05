import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  hasProductChanges,
  initialProductForm,
  newVariant,
  removeVariant,
  showVariantNames,
  validateProductForm,
} from "@/modules/inventory/components/productFormState";
import { STANDARD_VARIANT_NAME } from "@/modules/inventory/validation/productSchema";

describe("initialProductForm", () => {
  it("starts a new product with one Standard variant", () => {
    const form = initialProductForm();
    assert.equal(form.variants.length, 1);
    assert.equal(form.variants[0].name, STANDARD_VARIANT_NAME);
    assert.equal(form.variants[0].price, "");
    assert.equal(form.variants[0].currency, "PLN");
  });

  it("turns a saved product into text fields", () => {
    const form = initialProductForm({
      name: "Club T-shirt",
      variants: [{ id: "v1", name: "M", price: 79.9, currency: "EUR", stockQuantity: 4 }],
    });
    assert.deepEqual(form, {
      name: "Club T-shirt",
      description: "",
      imageUri: null,
      variants: [{ id: "v1", name: "M", price: "79.9", currency: "EUR", stockQuantity: "4" }],
    });
  });
});

describe("variants", () => {
  it("shows names only with two or more variants", () => {
    assert.equal(showVariantNames(1), false);
    assert.equal(showVariantNames(2), true);
  });

  it("brings back Standard when the last visible name is empty", () => {
    const rest = removeVariant([newVariant(""), newVariant("L")], 1);
    assert.equal(rest.length, 1);
    assert.equal(rest[0].name, STANDARD_VARIANT_NAME);
  });

  it("keeps a named last variant", () => {
    const rest = removeVariant([newVariant("M"), newVariant("L")], 0);
    assert.deepEqual(rest.map((v) => v.name), ["L"]);
  });
});

describe("hasProductChanges", () => {
  it("is false until a field changes", () => {
    const initial = initialProductForm();
    assert.equal(hasProductChanges(initialProductForm(), initial), false);
    assert.equal(hasProductChanges({ ...initial, name: "Gi" }, initial), true);
  });
});

describe("validateProductForm", () => {
  it("parses prices with a comma and the stock as numbers", () => {
    const result = validateProductForm({
      name: " Gi ",
      description: "",
      imageUri: null,
      variants: [{ name: STANDARD_VARIANT_NAME, price: "249,50", currency: "PLN", stockQuantity: "3" }],
    });
    assert.ok(result.ok);
    assert.deepEqual(result.data, {
      name: "Gi",
      description: undefined,
      imageUri: undefined,
      variants: [{ id: undefined, name: STANDARD_VARIANT_NAME, price: 249.5, currency: "PLN", stockQuantity: 3 }],
    });
  });

  it("reports the first error of each field by path", () => {
    const result = validateProductForm({
      name: "",
      description: "",
      imageUri: null,
      variants: [newVariant("M"), { ...newVariant(""), price: "10" }],
    });
    assert.ok(!result.ok);
    assert.equal(result.errors.name, "inventoryValidationNameRequired");
    assert.ok(result.errors["variants.0.price"]);
    assert.equal(result.errors["variants.1.name"], "inventoryValidationVariantNameRequired");
    assert.equal(result.errors["variants.1.price"], undefined);
  });
});
