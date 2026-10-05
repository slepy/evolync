import type { ProductDto } from "../types/dto";
import {
  DEFAULT_CURRENCY,
  DEFAULT_STOCK_QUANTITY,
  productFormSchema,
  STANDARD_VARIANT_NAME,
} from "../validation/productSchema";

/** Form state of one variant: price and stock are typed text until validation. */
export interface VariantFormValues {
  id?: string;
  name: string;
  price: string;
  currency: string;
  stockQuantity: string;
}

export interface ProductFormState {
  name: string;
  description: string;
  imageUri: string | null;
  variants: VariantFormValues[];
}

export const newVariant = (name = ""): VariantFormValues => ({
  name,
  price: "",
  currency: DEFAULT_CURRENCY,
  stockQuantity: String(DEFAULT_STOCK_QUANTITY),
});

/** Starting values of 9B (one Standard variant) or 9C (the product as saved). */
export function initialProductForm(product?: ProductDto): ProductFormState {
  if (!product) {
    return { name: "", description: "", imageUri: null, variants: [newVariant(STANDARD_VARIANT_NAME)] };
  }
  return {
    name: product.name,
    description: product.description ?? "",
    imageUri: product.imageUri ?? null,
    variants: product.variants.map((v) => ({
      id: v.id,
      name: v.name,
      price: String(v.price),
      currency: v.currency ?? DEFAULT_CURRENCY,
      stockQuantity: String(v.stockQuantity ?? DEFAULT_STOCK_QUANTITY),
    })),
  };
}

/**
 * A single variant is the product itself: its name stays hidden ("Standard").
 * With two or more each variant shows its NAME field.
 */
export const showVariantNames = (variantCount: number) => variantCount > 1;

/**
 * Removes a variant. When one is left and its (now hidden) name is empty, it
 * becomes Standard again so the form never fails on a field it does not show.
 */
export function removeVariant(variants: VariantFormValues[], index: number): VariantFormValues[] {
  const rest = variants.filter((_, i) => i !== index);
  if (rest.length === 1 && !rest[0].name.trim()) {
    return [{ ...rest[0], name: STANDARD_VARIANT_NAME }];
  }
  return rest;
}

/** Edit (9C) enables Save only after a change; create (9B) always allows Create. */
export function hasProductChanges(current: ProductFormState, initial: ProductFormState): boolean {
  return JSON.stringify(current) !== JSON.stringify(initial);
}

/** Field path ("name", "variants.1.price") → translation key of its first error. */
export type ProductFormErrors = Record<string, string>;

export type ProductFormValidation =
  | { ok: true; data: ProductDto }
  | { ok: false; errors: ProductFormErrors };

/** Runs the product schema on the form; empty description / photo become undefined. */
export function validateProductForm(state: ProductFormState): ProductFormValidation {
  const result = productFormSchema.safeParse({
    name: state.name,
    description: state.description,
    imageUri: state.imageUri,
    hasMultipleVariants: state.variants.length > 1,
    variants: state.variants.map((v) => ({
      id: v.id,
      name: v.name,
      price: v.price.trim() === "" ? undefined : v.price,
      currency: v.currency,
      stockQuantity: v.stockQuantity.trim() === "" ? undefined : v.stockQuantity,
    })),
  });

  if (!result.success) {
    const errors: ProductFormErrors = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".");
      if (!(path in errors)) errors[path] = issue.message;
    }
    return { ok: false, errors };
  }

  const { name, description, imageUri, variants } = result.data;
  return {
    ok: true,
    data: {
      name,
      description,
      imageUri,
      variants: variants.map((v) => ({
        id: v.id,
        name: v.name,
        price: v.price,
        currency: v.currency,
        stockQuantity: v.stockQuantity,
      })),
    },
  };
}
