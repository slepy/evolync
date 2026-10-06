import { OrderDetailsScreen } from "@/modules/orders";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";

/** Order details (12D) opened from a school: full edit. Route: /school/[schoolId]/orders/[orderId] */
export default function SchoolOrderDetailsScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  return <OrderDetailsScreen scope="school" orderId={orderId} onDone={() => router.back()} />;
}
