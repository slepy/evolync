import { LoadingScreen } from "@/core/components";
import { confirmDelete } from "@/core/utils/confirmDelete";
import { ProductFormScreen } from "@/modules/inventory/components";
import {
  deleteProduct,
  getProductById,
  updateProductWithVariants,
} from "@/modules/inventory/services/productService";
import type { ProductDto } from "@/modules/inventory/types/dto";
import { OrderItemRepository } from "@/modules/orders/repositories";
import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";

/** Edit product (9C). Route: /organization/inventory/[productId]/edit */
export default function EditProductScreen() {
  useRequireOrganizationOwner();
  const router = useRouter();
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const [product, setProduct] = useState<ProductDto | null>(null);

  useEffect(() => {
    if (!productId) {
      router.back();
      return;
    }

    getProductById(productId)
      .then((found) => {
        if (!found) {
          router.back();
          return;
        }
        setProduct({
          name: found.name,
          description: found.description ?? undefined,
          imageUri: found.imageUrl ?? undefined,
          variants: found.variants.map((v) => ({
            id: v.id,
            name: v.name,
            price: v.price,
            currency: v.currency,
            stockQuantity: v.stockQuantity,
          })),
        });
      })
      .catch((err) => {
        console.error("Error loading product:", err);
        router.back();
      });
  }, [productId, router]);

  const handleSubmit = async (data: ProductDto) => {
    await updateProductWithVariants(productId, data);
    router.back();
  };

  // Orders keep showing a deleted product, so the confirmation says how many reference it.
  const handleDelete = async () => {
    const variantIds = (product?.variants ?? [])
      .map((v) => v.id)
      .filter((id): id is string => !!id);
    const orderCount = variantIds.length
      ? await OrderItemRepository.countByVariantIds(variantIds)
      : 0;

    confirmDelete(
      t("delete"),
      orderCount > 0
        ? t("inventoryDeleteProductConfirmWithOrders", { count: orderCount })
        : t("inventoryDeleteProductConfirm"),
      async () => {
        await deleteProduct(productId);
        router.back();
      },
    );
  };

  if (!product) return <LoadingScreen />;

  return (
    <ProductFormScreen
      product={product}
      onSubmit={handleSubmit}
      onDelete={handleDelete}
    />
  );
}
