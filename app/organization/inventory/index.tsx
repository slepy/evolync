import { ProductsScreen } from "@/modules/inventory/components";
import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";
import React from "react";

/** Products list (9A). Route: /organization/inventory */
export default function InventoryScreen() {
  useRequireOrganizationOwner();
  return <ProductsScreen />;
}
