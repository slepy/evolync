import { OrderDetailsScreen } from "@/modules/orders";
import { useRequireOrganizationOwner } from "@/modules/organization/hooks/useRequireOrganizationOwner";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";

/** Order details (12D) opened from the organization: full edit. Route: /organization/orders/[orderId] */
export default function OrganizationOrderDetailsScreen() {
  useRequireOrganizationOwner();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  return <OrderDetailsScreen scope="organization" orderId={orderId} onDone={() => router.back()} />;
}
