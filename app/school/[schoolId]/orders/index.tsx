import { OrdersScreen, useOrdersList } from "@/modules/orders";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";

/** Orders of one school (12A / 12B) with Add new. Route: /school/[schoolId]/orders */
export default function SchoolOrdersScreen() {
  const { schoolId } = useLocalSearchParams<{ schoolId: string }>();
  const router = useRouter();
  const { entries, isLoading, error } = useOrdersList({ scope: "school", schoolId });

  return (
    <OrdersScreen
      scope="school"
      entries={entries}
      isLoading={isLoading}
      error={error}
      onAdd={() => router.push(`/school/${schoolId}/orders/create`)}
      onOrderPress={(entry) => router.push(`/school/${schoolId}/orders/${entry.orderId}`)}
    />
  );
}
