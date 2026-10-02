import type { OrderStatus } from "@/modules/orders/types";
import React from "react";
import type { ColorTokens } from "tamagui";
import { Text, XStack } from "tamagui";

// ============================================================================
// Types
// ============================================================================

interface StatusConfig {
  color: ColorTokens;
  bg: ColorTokens;
  label: string;
}

// ============================================================================
// OrderStatusBadge Component
// ============================================================================

export const OrderStatusBadge: React.FC<{ status: OrderStatus }> = ({
  status,
}) => {
  const statusConfigMap: Record<OrderStatus, StatusConfig> = {
    placed: {
      color: "$textPrimary",
      bg: "$fillStrong",
      label: t("statusPlaced"),
    },
    paid: {
      color: "$blue11",
      bg: "$blue3",
      label: t("statusPaid"),
    },
    processing: {
      color: "$warningText",
      bg: "$warningSurface",
      label: t("statusProcessing"),
    },
    ready_for_pickup: {
      color: "$purple10",
      bg: "$purple3",
      label: t("statusReadyForPickup"),
    },
    completed: {
      color: "$jadeGreen",
      bg: "$successSurface",
      label: t("statusCompleted"),
    },
  };

  const config = statusConfigMap[status] ?? {
    color: "$textPrimary",
    bg: "$fillStrong",
    label: status,
  };

  return (
    <XStack
      backgroundColor={config.bg}
      paddingHorizontal="$2"
      paddingVertical="$1"
      borderRadius="$2"
    >
      <Text fontSize="$2" color={config.color} fontWeight="600">
        {config.label}
      </Text>
    </XStack>
  );
};
