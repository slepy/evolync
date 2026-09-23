import { z } from 'zod';

/**
 * Supported currency codes (ISO 4217)
 * Commonly used currencies in the application
 */
export const SUPPORTED_CURRENCIES = ['PLN', 'EUR', 'USD', 'GBP'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

/**
 * Default currency for new products
 */
export const DEFAULT_CURRENCY: SupportedCurrency = 'PLN';

/**
 * Default stock quantity for new products
 */
export const DEFAULT_STOCK_QUANTITY = 0;

// ============================================================================
// Product Variant Schemas
// ============================================================================

/**
 * Validation schema for creating a product variant
 */
export const createProductVariantSchema = z.object({
  name: z
    .string({
      required_error: 'inventoryValidationVariantNameRequired',
      invalid_type_error: 'inventoryValidationVariantNameInvalidType',
    })
    .min(1, 'inventoryValidationVariantNameRequired')
    .max(100, 'inventoryValidationVariantNameTooLong')
    .trim(),

  price: z.preprocess(
    (val) => (typeof val === 'string' ? val.replace(',', '.') : val),
    z.coerce
      .number({
        required_error: 'inventoryValidationPriceRequired',
        invalid_type_error: 'inventoryValidationPriceInvalidType',
      })
      .positive('inventoryValidationPriceMustBePositive')
      .multipleOf(0.01, 'inventoryValidationPriceTooManyDecimals')
  ),

  currency: z
    .string()
    .length(3, 'inventoryValidationCurrencyInvalidFormat')
    .toUpperCase()
    .refine(
      (val) => SUPPORTED_CURRENCIES.includes(val as SupportedCurrency),
      'inventoryValidationCurrencyNotSupported'
    )
    .optional()
    .default(DEFAULT_CURRENCY),

  stockQuantity: z.coerce
    .number()
    .int('stockMustBeInteger')
    .nonnegative('inventoryValidationStockCannotBeNegative')
    .optional()
    .default(DEFAULT_STOCK_QUANTITY),
});

export type CreateProductVariantFormValues = z.infer<typeof createProductVariantSchema>;

/**
 * Validation schema for updating a product variant
 */
export const updateProductVariantSchema = z.object({
  name: z
    .string()
    .min(1, 'inventoryValidationVariantNameRequired')
    .max(100, 'inventoryValidationVariantNameTooLong')
    .trim()
    .optional(),

  price: z.preprocess(
    (val) => (typeof val === 'string' ? val.replace(',', '.') : val),
    z.coerce
      .number()
      .positive('inventoryValidationPriceMustBePositive')
      .multipleOf(0.01, 'inventoryValidationPriceTooManyDecimals')
      .optional()
  ),

  currency: z
    .string()
    .length(3, 'inventoryValidationCurrencyInvalidFormat')
    .toUpperCase()
    .refine(
      (val) => SUPPORTED_CURRENCIES.includes(val as SupportedCurrency),
      'inventoryValidationCurrencyNotSupported'
    )
    .optional(),

  stockQuantity: z.coerce
    .number()
    .int('stockMustBeInteger')
    .nonnegative('inventoryValidationStockCannotBeNegative')
    .optional(),
});

export type UpdateProductVariantFormValues = z.infer<typeof updateProductVariantSchema>;

// ============================================================================
// Product Schemas
// ============================================================================

/**
 * Standard variant name for single-variant products
 */
export const STANDARD_VARIANT_NAME = 'Standard';

/**
 * Validation schema for creating a new product with variants
 *
 * Validation rules:
 * - name: Required, 1-255 characters, trimmed
 * - description: Optional, max 1000 characters
 * - imageUri: Optional, local file URI for uploaded image
 * - hasMultipleVariants: Boolean switch for variant mode
 * - variants: Array of variants (at least one required)
 *   - When hasMultipleVariants=false: first variant name must be STANDARD_VARIANT_NAME
 *   - When hasMultipleVariants=true: variant names are user-defined
 */
export const createProductSchema = z
  .object({
    name: z
      .string({
        required_error: 'inventoryValidationNameRequired',
        invalid_type_error: 'inventoryValidationNameInvalidType',
      })
      .min(1, 'inventoryValidationNameRequired')
      .max(255, 'inventoryValidationNameTooLong')
      .trim(),

    description: z
      .string()
      .max(1000, 'inventoryValidationDescriptionTooLong')
      .trim()
      .optional()
      .nullable()
      .transform((val) => val || undefined),

    imageUri: z
      .string()
      .optional()
      .nullable()
      .transform((val) => val || undefined),

    hasMultipleVariants: z.boolean().default(false),

    // Variants array - always at least one variant required
    variants: z.array(createProductVariantSchema).min(1, 'inventoryValidationAtLeastOneVariant'),
  });

export type CreateProductFormValues = z.infer<typeof createProductSchema>;

/**
 * Validation schema for updating an existing product
 * All fields are optional - only provided fields will be validated
 */
export const updateProductSchema = z.object({
  name: z
    .string()
    .min(1, 'inventoryValidationNameRequired')
    .max(255, 'inventoryValidationNameTooLong')
    .trim()
    .optional(),

  description: z
    .string()
    .max(1000, 'inventoryValidationDescriptionTooLong')
    .trim()
    .optional()
    .nullable()
    .transform((val) => val || undefined),

  imageUrl: z
    .string()
    .url('inventoryValidationImageUrlInvalid')
    .optional()
    .nullable()
    .transform((val) => val || undefined),
});

export type UpdateProductFormValues = z.infer<typeof updateProductSchema>;

// ============================================================================
// Unified Product Form Schema (for both Create and Edit)
// ============================================================================

/**
 * Schema for variant with optional ID (works for both create and edit)
 * - Create mode: id is undefined
 * - Edit mode: id is present for existing variants, undefined for new ones
 */
export const productFormVariantSchema = z.object({
  id: z.string().optional(),

  name: z
    .string({
      required_error: 'inventoryValidationVariantNameRequired',
      invalid_type_error: 'inventoryValidationVariantNameInvalidType',
    })
    .min(1, 'inventoryValidationVariantNameRequired')
    .max(100, 'inventoryValidationVariantNameTooLong')
    .trim(),

  price: z.preprocess(
    (val) => (typeof val === 'string' ? val.replace(',', '.') : val),
    z.coerce
      .number({
        required_error: 'inventoryValidationPriceRequired',
        invalid_type_error: 'inventoryValidationPriceInvalidType',
      })
      .positive('inventoryValidationPriceMustBePositive')
      .multipleOf(0.01, 'inventoryValidationPriceTooManyDecimals')
  ),

  currency: z
    .string()
    .length(3, 'inventoryValidationCurrencyInvalidFormat')
    .toUpperCase()
    .refine(
      (val) => SUPPORTED_CURRENCIES.includes(val as SupportedCurrency),
      'inventoryValidationCurrencyNotSupported'
    )
    .optional()
    .default(DEFAULT_CURRENCY),

  stockQuantity: z.coerce
    .number()
    .int('stockMustBeInteger')
    .nonnegative('inventoryValidationStockCannotBeNegative')
    .optional()
    .default(DEFAULT_STOCK_QUANTITY),
});

export type ProductFormVariantValues = z.infer<typeof productFormVariantSchema>;

/**
 * Unified validation schema for product form (create and edit)
 */
export const productFormSchema = z.object({
  name: z
    .string({
      required_error: 'inventoryValidationNameRequired',
      invalid_type_error: 'inventoryValidationNameInvalidType',
    })
    .min(1, 'inventoryValidationNameRequired')
    .max(255, 'inventoryValidationNameTooLong')
    .trim(),

  description: z
    .string()
    .max(1000, 'inventoryValidationDescriptionTooLong')
    .trim()
    .optional()
    .nullable()
    .transform((val) => val || undefined),

  imageUri: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val || undefined),

  hasMultipleVariants: z.boolean().default(false),

  variants: z.array(productFormVariantSchema).min(1, 'inventoryValidationAtLeastOneVariant'),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

// Legacy aliases for backward compatibility
export const editProductVariantSchema = productFormVariantSchema;
export type EditProductVariantFormValues = ProductFormVariantValues;
export const editProductSchema = productFormSchema;
export type EditProductFormValues = ProductFormValues;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Helper function to validate product creation data
 */
export function validateCreateProduct(data: unknown): CreateProductFormValues {
  return createProductSchema.parse(data);
}

/**
 * Helper function for safe validation (doesn't throw)
 */
export function safeValidateCreateProduct(data: unknown) {
  return createProductSchema.safeParse(data);
}

/**
 * Helper function to validate variant creation data
 */
export function validateCreateProductVariant(data: unknown): CreateProductVariantFormValues {
  return createProductVariantSchema.parse(data);
}

/**
 * Helper function for safe variant validation (doesn't throw)
 */
export function safeValidateCreateProductVariant(data: unknown) {
  return createProductVariantSchema.safeParse(data);
}
