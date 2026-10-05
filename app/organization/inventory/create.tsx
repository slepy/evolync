import { ProductFormScreen } from "@/modules/inventory/components";
import { createProduct } from "@/modules/inventory/services/productService";
import type { ProductDto } from "@/modules/inventory/types/dto";
import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";
import { useRouter } from "expo-router";
import React from "react";

/** New product (9B). Route: /organization/inventory/create */
export default function CreateProductScreen() {
  useRequireOrganizationOwner();
  const router = useRouter();

  const handleSubmit = async (data: ProductDto) => {
    await createProduct(data);
    router.back();
  };

  return <ProductFormScreen onSubmit={handleSubmit} />;
}
