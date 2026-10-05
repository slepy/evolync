import { database } from "@/database";
import { sync } from "@/database/sync";
import Product from "@/database/models/Product";
import ProductVariant from "@/database/models/ProductVariant";
import { uploadImage } from "@/modules/core/utils/uploadImage";
import { useStore } from "@/store";
import { v4 as uuidv4 } from "uuid";

import type {
  ProductDto,
  ProductVariantDto,
  ProductResponseDto,
  ProductVariantResponseDto,
  UpdateProductVariantDto,
} from "../types/dto";
import {
  createProductVariantSchema,
  DEFAULT_CURRENCY,
  DEFAULT_STOCK_QUANTITY,
} from "../validation/productSchema";
import {
  ProductRepository,
  ProductVariantRepository,
} from "../repositories";

/**
 * Service for managing products in offline-first architecture
 *
 * Architecture: Product has many ProductVariants
 * - Product: name, description, imageUrl (shared across variants)
 * - ProductVariant: name (e.g. "Size M"), price, currency, stockQuantity
 *
 * Key principles:
 * 1. All operations write to local WatermelonDB first
 * 2. Background sync propagates changes to Supabase
 * 3. UI is reactive to local database changes
 */

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Maps WatermelonDB ProductVariant model to ProductVariantResponseDto
 */
const mapVariantToDto = (
  variant: ProductVariant
): ProductVariantResponseDto => ({
  id: variant.id,
  productId: variant.productId,
  name: variant.name,
  price: variant.price,
  currency: variant.currency,
  stockQuantity: variant.stockQuantity,
  createdAt: variant.createdAt,
  updatedAt: variant.updatedAt,
});

/**
 * Maps WatermelonDB Product model to ProductResponseDto (with variants)
 */
const mapProductToDto = async (
  product: Product
): Promise<ProductResponseDto> => {
  const variants = await product.variants.fetch();
  const activeVariants = variants.filter((v) => !v.deletedAt);

  return {
    id: product.id,
    organizationId: product.organizationId,
    name: product.name,
    description: product.description ?? null,
    imageUrl: product.imageUrl ?? null,
    variants: activeVariants.map(mapVariantToDto),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
};

// ============================================================================
// Create Product
// ============================================================================

/**
 * Creates a new product with variants in the local database
 *
 * Flow:
 * 1. Validates user has an organization (throws if not owner)
 * 2. Uploads image to Supabase Storage (if provided)
 * 3. Generates UUID v4 for the product and variants
 * 4. Writes to WatermelonDB (product + variants in single transaction)
 * 5. Returns created product as DTO
 * 6. Background sync will push to Supabase
 */
export const createProduct = async (
  data: ProductDto
): Promise<ProductResponseDto> => {
  // 1. Validate we have variants
  if (!data.variants || data.variants.length === 0) {
    throw new Error("inventoryValidationAtLeastOneVariant");
  }

  // 2. Get organization from global state
  const { organization } = useStore.getState();

  if (!organization) {
    throw new Error("inventoryErrorNoOrganization");
  }

  // 3. Upload image to Supabase Storage (if provided)
  let imageUrl: string | undefined;
  if (data.imageUri) {
    try {
      imageUrl = await uploadImage(
        data.imageUri,
        "product-images",
        organization.id
      );
    } catch (err) {
      console.error("Failed to upload product image:", err);
      // Continue without image - user can retry later
    }
  }

  // 4. Generate UUIDs
  const productId = uuidv4();

  // 5. Write to local WatermelonDB (single transaction for product + variants)
  const product = await database.write(async () => {
    const productsCollection = database.get<Product>("products");
    const variantsCollection = database.get<ProductVariant>("product_variants");

    // Create product with uploaded image URL
    const newProduct = await productsCollection.create((record) => {
      record._raw.id = productId;
      record.organizationId = organization.id;
      record.name = data.name;
      record.description = data.description ?? undefined;
      record.imageUrl = imageUrl;
    });

    // Create all variants
    for (const variantData of data.variants) {
      const variantId = uuidv4();
      await variantsCollection.create((record) => {
        record._raw.id = variantId;
        record.productId = productId;
        record.name = variantData.name;
        record.price = variantData.price;
        record.currency = variantData.currency ?? DEFAULT_CURRENCY;
        record.stockQuantity =
          variantData.stockQuantity ?? DEFAULT_STOCK_QUANTITY;
      });
    }

    return newProduct;
  });

  // 6. Trigger sync to push changes to Supabase
  sync().catch((err) => {
    console.error("[createProduct] Sync failed:", err);
  });

  // 7. Return created product as DTO
  return mapProductToDto(product);
};

// ============================================================================
// Create Product Variant
// ============================================================================

/**
 * Adds a new variant to an existing product
 */
export const createProductVariant = async (
  productId: string,
  data: ProductVariantDto
): Promise<ProductVariantResponseDto> => {
  // Validate input
  const validationResult = createProductVariantSchema.safeParse(data);

  if (!validationResult.success) {
    const firstError = validationResult.error.errors[0];
    throw new Error(firstError?.message || "inventoryValidationFailed");
  }

  const validatedData = validationResult.data;

  const variant = await ProductVariantRepository.create({
    productId,
    name: validatedData.name,
    price: validatedData.price,
    currency: validatedData.currency ?? DEFAULT_CURRENCY,
    stockQuantity: validatedData.stockQuantity ?? DEFAULT_STOCK_QUANTITY,
  });

  sync().catch((err) => {
    console.error("[createProductVariant] Sync failed:", err);
  });

  return mapVariantToDto(variant);
};

// ============================================================================
// Get Products
// ============================================================================

/**
 * Fetches all products for the current organization from local database
 */
export const getProducts = async (): Promise<ProductResponseDto[]> => {
  const { organization } = useStore.getState();

  if (!organization) {
    throw new Error("inventoryErrorNoOrganization");
  }

  const products = await ProductRepository.findByOrganizationId(organization.id);
  return Promise.all(products.map(mapProductToDto));
};

/**
 * Fetches a single product by ID from local database
 */
export const getProductById = async (
  productId: string
): Promise<ProductResponseDto | null> => {
  const product = await ProductRepository.findById(productId);

  if (!product) {
    return null;
  }

  return mapProductToDto(product);
};

// ============================================================================
// Update Product
// ============================================================================

/**
 * Updates an existing product in the local database
 */
export const updateProduct = async (
  productId: string,
  data: Partial<{ name: string; description: string; imageUrl: string }>
): Promise<ProductResponseDto> => {
  const product = await ProductRepository.update(productId, data);

  sync().catch((err) => {
    console.error("[updateProduct] Sync failed:", err);
  });

  return mapProductToDto(product);
};

/**
 * Updates an existing product variant
 */
export const updateProductVariant = async (
  variantId: string,
  data: UpdateProductVariantDto
): Promise<ProductVariantResponseDto> => {
  const variant = await ProductVariantRepository.update(variantId, data);

  sync().catch((err) => {
    console.error("[updateProductVariant] Sync failed:", err);
  });

  return mapVariantToDto(variant);
};

// ============================================================================
// Update Product with Variants (Full Edit)
// ============================================================================

/**
 * Updates a product and its variants in a single transaction
 *
 * This handles:
 * - Uploading new image to Supabase Storage (if changed)
 * - Updating existing variants (by ID)
 * - Creating new variants (no ID)
 * - Soft-deleting removed variants (not in the new list)
 */
export const updateProductWithVariants = async (
  productId: string,
  data: ProductDto
): Promise<ProductResponseDto> => {
  const productsCollection = database.get<Product>("products");
  const variantsCollection = database.get<ProductVariant>("product_variants");

  // Get organization for image upload path
  const { organization } = useStore.getState();

  // Upload new image if provided and it's a local file; `null` removes it
  let newImageUrl: string | null | undefined;
  if (data.imageUri === null) {
    newImageUrl = null;
  } else if (data.imageUri && !data.imageUri.startsWith("http")) {
    try {
      newImageUrl = await uploadImage(
        data.imageUri,
        "product-images",
        organization?.id
      );
    } catch (err) {
      console.error("Failed to upload product image:", err);
      // Continue without updating image
    }
  } else if (data.imageUri) {
    // Keep existing remote URL
    newImageUrl = data.imageUri;
  }

  // Complex transaction with multiple entities - kept in service
  const product = await database.write(async () => {
    // 1. Update product
    const existingProduct = await productsCollection.find(productId);
    const updatedProduct = await existingProduct.update((record) => {
      record.name = data.name;
      // `null` clears the column (WatermelonDB stores undefined as null)
      if (data.description !== undefined) record.description = data.description ?? undefined;
      if (newImageUrl !== undefined) record.imageUrl = newImageUrl ?? undefined;
    });

    // 2. Get existing variants
    const existingVariants = await updatedProduct.variants.fetch();
    const activeExistingVariants = existingVariants.filter((v) => !v.deletedAt);

    // 3. Determine which variants to update, create, or delete
    const incomingVariantIds = data.variants
      .filter((v: ProductVariantDto) => v.id)
      .map((v: ProductVariantDto) => v.id as string);

    const operations: any[] = [];

    // Soft delete variants that are no longer in the list
    for (const existingVariant of activeExistingVariants) {
      if (!incomingVariantIds.includes(existingVariant.id)) {
        operations.push(
          existingVariant.prepareUpdate((record) => {
            record.deletedAt = new Date();
          })
        );
      }
    }

    // Update or create variants
    for (const variantData of data.variants) {
      if (variantData.id) {
        // Update existing variant
        const existingVariant = activeExistingVariants.find(
          (v) => v.id === variantData.id
        );
        if (existingVariant) {
          operations.push(
            existingVariant.prepareUpdate((record) => {
              record.name = variantData.name;
              record.price = variantData.price;
              if (variantData.currency) record.currency = variantData.currency;
              if (variantData.stockQuantity !== undefined)
                record.stockQuantity = variantData.stockQuantity;
            })
          );
        }
      } else {
        // Create new variant
        const variantId = uuidv4();
        operations.push(
          variantsCollection.prepareCreate((record) => {
            record._raw.id = variantId;
            record.productId = productId;
            record.name = variantData.name;
            record.price = variantData.price;
            record.currency = variantData.currency ?? DEFAULT_CURRENCY;
            record.stockQuantity =
              variantData.stockQuantity ?? DEFAULT_STOCK_QUANTITY;
          })
        );
      }
    }

    if (operations.length > 0) {
      await database.batch(operations);
    }

    return updatedProduct;
  });

  // Trigger sync to push changes to Supabase
  sync().catch((err) => {
    console.error("[updateProductWithVariants] Sync failed:", err);
  });

  return mapProductToDto(product);
};

// ============================================================================
// Delete Product (Soft Delete)
// ============================================================================

/**
 * Soft deletes a product and all its variants
 */
export const deleteProduct = async (productId: string): Promise<void> => {
  // Soft delete all variants first
  await ProductVariantRepository.softDeleteByProductId(productId);

  // Soft delete the product
  await ProductRepository.softDelete(productId);

  sync().catch((err) => {
    console.error("[deleteProduct] Sync failed:", err);
  });
};

/**
 * Soft deletes a single product variant
 */
export const deleteProductVariant = async (variantId: string): Promise<void> => {
  await ProductVariantRepository.softDelete(variantId);

  sync().catch((err) => {
    console.error("[deleteProductVariant] Sync failed:", err);
  });
};
