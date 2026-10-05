import { useEffect, useState } from "react";
import type Product from "@/database/models/Product";
import { ProductRepository } from "../repositories";
import type { ProductResponseDto } from "../types/dto";

const toDto = async (product: Product): Promise<ProductResponseDto> => {
  const variants = await product.variants.fetch();
  return {
    id: product.id,
    organizationId: product.organizationId,
    name: product.name,
    description: product.description ?? null,
    imageUrl: product.imageUrl ?? null,
    variants: variants
      .filter((v) => !v.deletedAt)
      .map((v) => ({
        id: v.id,
        productId: v.productId,
        name: v.name,
        price: v.price,
        currency: v.currency,
        stockQuantity: v.stockQuantity,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      })),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
};

/** Organization products with their active variants, sorted by name; re-emits on edits. */
export const useProducts = (organizationId: string) => {
  const [products, setProducts] = useState<ProductResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) {
      setIsLoading(false);
      return;
    }

    let active = true;
    // Variants load async: only the latest emission may win.
    let latest = 0;
    const subscription = ProductRepository.observeListByOrganizationId(
      organizationId,
    ).subscribe(
      async (result: Product[]) => {
        const run = ++latest;
        const dtos = await Promise.all(result.map(toDto));
        if (!active || run !== latest) return;
        setProducts(dtos);
        setIsLoading(false);
      },
      (error: Error) => {
        console.error("[useProducts] Error observing:", error);
        setIsLoading(false);
      },
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [organizationId]);

  return { products, isLoading };
};
