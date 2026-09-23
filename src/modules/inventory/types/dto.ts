/**
 * Data Transfer Objects for Inventory module
 * These types represent data flowing between UI and services
 *
 * Architecture: Product has many ProductVariants
 * - Product: name, description, imageUrl (shared across variants)
 * - ProductVariant: name (e.g. "Size M"), price, currency, stockQuantity
 */

// ============================================================================
// Product Variant DTOs
// ============================================================================

/**
 * DTO for creating/updating a product variant
 * - Create mode: id is undefined
 * - Edit mode: id is present for existing variants, undefined for new ones
 */
export interface ProductVariantDto {
  id?: string;
  name: string;
  price: number;
  currency?: string;
  stockQuantity?: number;
}

/**
 * Response DTO for product variant
 */
export interface ProductVariantResponseDto {
  id: string;
  productId: string;
  name: string;
  price: number;
  currency: string;
  stockQuantity: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for partial variant updates (used by service layer)
 */
export interface UpdateProductVariantDto {
  name?: string;
  price?: number;
  currency?: string;
  stockQuantity?: number;
}

// ============================================================================
// Product DTOs
// ============================================================================

/**
 * DTO for creating/updating a product with variants
 * Used by both create and edit flows
 *
 * @property name - Product name (required, 1-255 chars)
 * @property description - Product description (optional, max 1000 chars)
 * @property imageUri - Local file URI for uploaded image (optional)
 * @property variants - Array of variant data (at least one required)
 *
 * Note: organization_id is obtained from user context (Zustand store)
 */
export interface ProductDto {
  name: string;
  description?: string;
  imageUri?: string;
  variants: ProductVariantDto[];
}

/**
 * Response DTO for product operations
 * Includes variants array for full product data
 */
export interface ProductResponseDto {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  variants: ProductVariantResponseDto[];
  createdAt: Date;
  updatedAt: Date;
}
