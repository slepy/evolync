import { OrderDetailsScreen } from "@/modules/orders";
import { useStore } from "@/store";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";

/** The student's order (12D): editable only while placed. Route: /user/orders/[orderId] */
export default function UserOrderDetailsScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const membership = useStore((state) => state.getActiveMembership());
  return (
    <OrderDetailsScreen
      scope="student"
      orderId={orderId}
      memberId={membership?.memberId}
      onDone={() => router.back()}
      onOpenEvent={(eventId) => router.push({ pathname: "/user/events/[eventId]", params: { eventId } })}
    />
  );
}
