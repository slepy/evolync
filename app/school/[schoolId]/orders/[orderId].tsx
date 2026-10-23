import { OrderDetailsScreen, orderEventTarget } from "@/modules/orders";
import { useStore } from "@/store";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";

/**
 * Order details (12D) opened from a school: full edit. The Event row opens
 * the organization's event details only for the organization owner.
 * Route: /school/[schoolId]/orders/[orderId]
 */
export default function SchoolOrderDetailsScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const ownsOrganization = useStore((s) => s.organization !== null);
  const canOpenEvent = orderEventTarget("school", ownsOrganization) === "organization";
  return (
    <OrderDetailsScreen
      scope="school"
      orderId={orderId}
      onDone={() => router.back()}
      onOpenEvent={
        canOpenEvent
          ? (eventId) => router.push({ pathname: "/organization/events/[eventId]", params: { eventId } })
          : undefined
      }
    />
  );
}
