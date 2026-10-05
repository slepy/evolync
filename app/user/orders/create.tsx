import { SubScreenPage } from "@/core/components";
import { OrderFormScreen } from "@/modules/orders";
import { useStore } from "@/store";
import { useRouter } from "expo-router";
import React from "react";
import { Text } from "tamagui";

/** The student's new order (12E) for themselves. Route: /user/orders/create */
export default function UserCreateOrderScreen() {
  const router = useRouter();
  const membership = useStore((state) => state.getActiveMembership());

  if (!membership) {
    return (
      <SubScreenPage title={t("ordersCreateTitle")}>
        <Text fontSize={15} fontWeight="$secondary" color="$neutralMuted" textAlign="center">
          {t("pendingMembershipInfo")}
        </Text>
      </SubScreenPage>
    );
  }

  return (
    <OrderFormScreen
      scope="student"
      schoolId={membership.schoolId}
      memberId={membership.memberId}
      onCreated={() => router.back()}
    />
  );
}
