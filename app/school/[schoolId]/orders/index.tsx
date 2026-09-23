import { OrdersListScreen, useOrders } from "@/modules/orders";
import type { OrderWithDetails } from "@/modules/orders/types/orders";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";

/**
 * School Orders Screen
 *
 * Route: /school/[schoolId]/orders
 *
 * Displays orders for a specific school using the shared OrdersListScreen component.
 */
export default function SchoolOrdersScreen() {
  const { schoolId } = useLocalSearchParams<{ schoolId: string }>();
  const router = useRouter();

  const { orders, isLoading, error } = useOrders(schoolId);

  const getOrderPath = (order: OrderWithDetails) =>
    `/school/${schoolId}/orders/${order.orderId}`;

  const handleCreateOrder = () => {
    router.push(`/school/${schoolId}/orders/create`);
  };

  return (
    <OrdersListScreen
      orders={orders}
      isLoading={isLoading}
      error={error}
      showCreateFab={true}
      onCreateOrder={handleCreateOrder}
      getOrderPath={getOrderPath}
      onBack={() => router.back()}
      routerPush={(path) => router.push(path as never)}
    />
  );
}
