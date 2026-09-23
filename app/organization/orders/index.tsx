import { OrdersListScreen, useOrganizationOrders } from "@/modules/orders";
import type { OrderWithDetails } from "@/modules/orders/types/orders";
import { useStore } from "@/store";
import { useRouter } from "expo-router";
import React from "react";

/**
 * Organization Orders Screen
 *
 * Route: /organization/orders
 *
 * Displays orders from all schools in the organization using the shared
 * OrdersListScreen component.
 */
export default function OrganizationOrdersScreen() {
  const router = useRouter();
  const { organization } = useStore();

  const { orders, isLoading, error } = useOrganizationOrders(organization?.id);

  const getOrderPath = (order: OrderWithDetails) =>
    `/school/${order.schoolId}/orders/${order.orderId}`;

  return (
    <OrdersListScreen
      orders={orders}
      isLoading={isLoading}
      error={error}
      showCreateFab={false}
      getOrderPath={getOrderPath}
      onBack={() => router.back()}
      routerPush={(path) => router.push(path as never)}
    />
  );
}
