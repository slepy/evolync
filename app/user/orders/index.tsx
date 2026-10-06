import { SubScreenPage } from "@/core/components";
import { OrdersScreen, useOrdersList } from "@/modules/orders";
import { useStore } from "@/store";
import { useRouter } from "expo-router";
import React from "react";
import { Text } from "tamagui";

/** The student's own orders (12A) with Add new. Route: /user/orders */
export default function UserOrdersScreen() {
  const router = useRouter();
  const membership = useStore((state) => state.getActiveMembership());
  const { entries, isLoading, error } = useOrdersList({ scope: "student", memberId: membership?.memberId });

  if (!membership) {
    return (
      <SubScreenPage title={t("ordersTitle")}>
        <Text fontSize={15} fontWeight="$secondary" color="$neutralMuted" textAlign="center">
          {t("pendingMembershipInfo")}
        </Text>
      </SubScreenPage>
    );
  }

  return (
    <OrdersScreen
      scope="student"
      entries={entries}
      isLoading={isLoading}
      error={error}
      onAdd={() => router.push("/user/orders/create" as never)}
      onOrderPress={(entry) => router.push(`/user/orders/${entry.orderId}` as never)}
    />
  );
}
