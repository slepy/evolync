import { OrdersScreen, useOrdersList } from "@/modules/orders";
import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";
import { useStore } from "@/store";
import { useRouter } from "expo-router";
import React from "react";

/** Orders of every school (12A / 12B), no Add new. Route: /organization/orders */
export default function OrganizationOrdersScreen() {
  useRequireOrganizationOwner();
  const router = useRouter();
  const { organization } = useStore();
  const { entries, isLoading, error } = useOrdersList({ scope: "organization", organizationId: organization?.id });

  return (
    <OrdersScreen
      scope="organization"
      subtitle={t("ordersAllSchools")}
      entries={entries}
      isLoading={isLoading}
      error={error}
      onOrderPress={(entry) => router.push(`/organization/orders/${entry.orderId}` as never)}
    />
  );
}
